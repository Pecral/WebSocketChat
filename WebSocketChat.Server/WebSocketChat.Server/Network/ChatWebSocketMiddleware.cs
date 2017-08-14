using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using WebSocketChat.Server.Common;
using WebSocketChat.Server.Helper;
using WebSocketChat.Server.Models.Chat;
using WebSocketChat.Server.Models.Chat.Messages;
using WebSocketChat.Server.Models.Chat.ThreadingHelper;

namespace WebSocketChat.Server.Network
{
    public class ChatWebSocketMiddleware
    {
        private static ConcurrentDictionary<string, ChatPartner> _sockets = new ConcurrentDictionary<string, ChatPartner>();
        private static ConcurrentDictionary<int, ChatRoom> _chatrooms = new ConcurrentDictionary<int, ChatRoom>();
        private ChatRoom _globalRoom;
        private IdentifierIncreaser _chatRoomIdentifierCounter = new IdentifierIncreaser();
        private Object _userRemovalLockObject = new object();

        /// <summary>
        /// List of users which are currently disconnecting (if alot of users disconnect simultaneously, we need this list to check whether the leaving user is already handled)
        /// </summary>
        private List<string> _queuedUsersToDisconnect = new List<string>();

        private readonly RequestDelegate _next;

        public ChatWebSocketMiddleware(RequestDelegate next)
        {
            //create global room
            _globalRoom = CreateNewChatRoom();
            _globalRoom.Name = "Global Room";
            _globalRoom.IsPrivateRoom = false;
            _globalRoom.RoomAvatarBase64 = ImageUrlToBase64Encoder.GetImageAsBase64Url("https://i.imgur.com/G4EjwqQ.jpg");
            
            //dummy rooms
            var offtopicRoom = CreateNewChatRoom();
            offtopicRoom.Name = "Offtopic";
            offtopicRoom.RoomAvatarBase64 = ImageUrlToBase64Encoder.GetImageAsBase64Url("http://compsci.ca/v3/uploads/user_avatars/10820786614fe1f6d9ccbda.png");

            var developmentRoom = CreateNewChatRoom();
            developmentRoom.Name = "Development";

            var testRoom = CreateNewChatRoom();
            testRoom.Name = "Test";
            testRoom.Password = "Test";

            _chatrooms.TryAdd(_globalRoom.RoomIdentifier, _globalRoom);
            _next = next;
        }

        /// <summary>
        /// This method will be called as soon as the browser sends a HTTP-request to the server. 
        /// We will only continue if it's a WebSocket-request.
        /// </summary>
        /// <param name="context"></param>
        /// <returns></returns>
        public async Task Invoke(HttpContext context)
        {
            if (!context.WebSockets.IsWebSocketRequest)
            {
                await _next.Invoke(context);
                return;
            }

            ChatPartner dummy;
            CancellationToken ct = context.RequestAborted;
            WebSocket currentSocket = await context.WebSockets.AcceptWebSocketAsync();
            var socketId = Guid.NewGuid().ToString();

            await AcceptNewUser(currentSocket, socketId);
            await SendServerInformationToUser(currentSocket, socketId);

            while (currentSocket.State == WebSocketState.Open && !ct.IsCancellationRequested)
            {
                try
                {
                    string response = await ReceiveStringAsync(currentSocket, ct);

                    if (string.IsNullOrEmpty(response))
                    {
                        if (currentSocket.State != WebSocketState.Open)
                        {
                            break;
                        }

                        continue;
                    }

                    await HandleMessage(response, socketId);
                }
                catch(WebSocketException ex)
                {
                    //the connection to the websocket is aborted, so we'll remove it from the server
                    break;
                }
                catch(Exception ex)
                {
                    //catch other errors.. TODO: Logging
                    break;
                }
            }

            //if we reach this point, it means that the websocket to the user is closed
            //it could be the case that we wanted to connect it from another thread but it did not respond, so we've already removed it from the socket-dictionary
            //that's why we have to check whether it still exists first
            if(_sockets.ContainsKey(socketId))
            {
                try
                {
                    await DisconnectUserFromServer(socketId);
                }
                catch (Exception ex)
                {
                    //the removal of the websocket fails sometimes
                }
            }
        }

        /// <summary>
        /// Handles the received message depending on its message type
        /// </summary>
        /// <param name="message"></param>
        /// <returns></returns>
        private async Task HandleMessage(string messageString, string socketId)
        {
            Message message = null;
            JObject jsonMessage = null;

            try
            {
                jsonMessage = JObject.Parse(messageString);
                message = JsonConvert.DeserializeObject<Message>(messageString);
            }
            catch{ }

            //if it's a valid "Message", we will continue
            if (message != null)
            {
                //the user's identifier should always be saved in the senderGuid-property
                jsonMessage["senderGuid"] = socketId;

                switch(message.MessageType)
                {
                    //as long as rooms are not implemented, we can broadcast the message to the whole server
                    case MessageType.ChatMessage:
                        ChatMessage chatMessage = jsonMessage.ToObject<ChatMessage>();;

                        await HandleChatMessage(socketId, chatMessage.RoomIdentifier, chatMessage.Recipient, jsonMessage.ToString());
                    break;

                    case MessageType.RoomCreationRequest:
                        RoomCreationRequest roomRequest = jsonMessage.ToObject<RoomCreationRequest>();
                        roomRequest.RequestedRoom = CreateNewChatRoom(roomRequest.RequestedRoom);

                        await InviteUsersToRoom(roomRequest, true);
                    break;

                    case MessageType.NicknameRequest:
                        NicknameRequest nameRequest = jsonMessage.ToObject<NicknameRequest>();
                        nameRequest.WasSuccessful = false;
                        lock (_sockets)
                        {
                            if (IsNicknameAvailable(nameRequest.RequestedNickname))
                            {
                                nameRequest.WasSuccessful = true;
                                _sockets.FirstOrDefault(x => x.Key == socketId).Value.Nickname = nameRequest.RequestedNickname;
                            }
                        }

                        if(nameRequest.WasSuccessful)
                        {
                            await SendMessageIntoRoom(_globalRoom, JsonConvert.SerializeObject(nameRequest, Global.SerializerSettings));
                        }
                    break;

                    case MessageType.RoomJoinRequest:
                        RoomJoinRequest joinRequest = jsonMessage.ToObject<RoomJoinRequest>();
                        await HandleRoomJoinRequest(joinRequest);
                    break;

                }
            }
        }

        /// <summary>
        /// Handles the room join request of a user and adds him to the room if the password is correct
        /// </summary>
        /// <param name="joinRequest"></param>
        /// <returns></returns>
        private async Task HandleRoomJoinRequest(RoomJoinRequest joinRequest)
        {
            //send the user the result of his request (helper method to avoid duplicate code9
            async Task sendRequestResult(bool success) {
                //send the user a message back that the password was wrong
                if (_sockets.TryGetValue(joinRequest.SenderGuid, out ChatPartner user))
                {
                    joinRequest.IsSuccessful = success;
                    string serialized = JsonConvert.SerializeObject(joinRequest, Global.SerializerSettings);

                    await SendStringAsync(user.WebSocket, user.Identifier, serialized, CancellationToken.None);
                }
            }

            //check if the room exists and if the correct password is supplied (if the room is password protected)
            if (_chatrooms.TryGetValue(joinRequest.RoomIdentifier, out ChatRoom joinRoom))
            {
                if ((!joinRoom.IsPasswordProtected || joinRoom.Password == joinRequest.Password)
                    && !joinRoom.ConnectedUsers.Contains(joinRequest.SenderGuid))
                {
                    joinRoom.ConnectedUsers.Add(joinRequest.SenderGuid);

                    var joinMessage = new UserJoinMessage()
                    {
                        SenderGuid = joinRequest.SenderGuid,
                        RoomIdentifier = joinRequest.RoomIdentifier,
                        Timestamp = DateTime.Now
                    };

                    await sendRequestResult(true);
                    await InformUsersAboutJoin(joinMessage, joinRoom);
                }
                else
                {
                    await sendRequestResult(false);
                }
            }
        }

        /// <summary>
        /// Handles a chat message
        /// </summary>
        /// <param name="sender">GUID of the sender</param>
        /// <param name="targetedRoom">identifier of the targeted room</param>
        /// <param name="recipient">GUID of the recipient</param>
        /// <param name="messageContent">The message itself</param>
        /// <returns></returns>
        private async Task HandleChatMessage(string sender, int? targetedRoom, string recipient, string messageContent)
        {
            ChatRoom targetRoom;
            
            //if the targeted room exists, send the message into it
            if(targetedRoom.HasValue && _chatrooms.TryGetValue(targetedRoom.Value, out targetRoom))
            {
                //check whether the sender is in the room and if a recipient is set, he should also be in the room
                if(targetRoom.ConnectedUsers.Contains(sender) && (recipient == null || targetRoom.ConnectedUsers.Contains(recipient)))
                {
                    await SendMessageIntoRoom(targetRoom, messageContent);
                }
            }
            //if the targeted room is null and the recipient exists, it is a private message which room is not created yet
            else if (!targetedRoom.HasValue && recipient != null && _sockets.TryGetValue(recipient, out ChatPartner dummy))
            {
                //check whether a room between them doesn't exist yet
                targetRoom = _chatrooms.Values.FirstOrDefault(x => x.IsPrivateRoom && x.ConnectedUsers.Contains(sender) && x.ConnectedUsers.Contains(recipient));

                if (targetRoom == null)
                {
                    targetRoom = CreateNewChatRoom();
                    targetRoom.IsPrivateRoom = true;
                    targetRoom.ConnectedUsers.Add(sender);
                    targetRoom.ConnectedUsers.Add(recipient);

                    RoomCreationRequest request = new RoomCreationRequest()
                    {
                        RequestedRoom = targetRoom,
                        SenderGuid = sender
                    };

                    //inform the two users about the new room
                    await InviteUsersToRoom(request, false);
                }

                await SendMessageIntoRoom(targetRoom, messageContent);
            }
        }

        /// <summary>
        /// Invite users into a new chatroom
        /// </summary>
        /// <param name="room"></param>
        /// <param name="userIdentifier"></param>
        /// <returns></returns>
        private async Task InviteUsersToRoom(RoomCreationRequest message, bool showRoomToAll)
        {
            string serialized = JsonConvert.SerializeObject(message, Global.SerializerSettings);

            if(showRoomToAll)
            {
                await SendMessageIntoRoom(_globalRoom, serialized);
            }
            else
            {
                await SendMessageIntoRoom(message.RequestedRoom, serialized);
            }
            
        }

        /// <summary>
        /// Send message into the whole room
        /// </summary>
        /// <param name="room"></param>
        /// <param name="message"></param>
        /// <returns></returns>
        private async Task SendMessageIntoRoom(ChatRoom room, string message)
        {
            List<string> usersCopy = room.ConnectedUsers.Except(_queuedUsersToDisconnect).ToList();

            await Task.WhenAll(usersCopy.Select(userIdentifier =>
            {
                if (_sockets.TryGetValue(userIdentifier, out ChatPartner user))
                {
                    return SendStringAsync(user.WebSocket, userIdentifier, message, CancellationToken.None);
                }

                return Task.CompletedTask;
            }).ToArray());
        }

        /// <summary>
        /// Accept a new user, search a free user name and inform the other users
        /// </summary>
        /// <param name="socket"></param>
        /// <param name="socketId"></param>
        /// <returns></returns>
        private async Task AcceptNewUser(WebSocket socket, string socketId)
        {
            ChatPartner newChatPartner = new ChatPartner()
            {
                WebSocket = socket,
            };

            lock (_sockets)
            {
                newChatPartner.Nickname = GetFreeNickname("anonymous");
                newChatPartner.Identifier = socketId;
                _sockets.TryAdd(socketId, newChatPartner);
            }

            _globalRoom.ConnectedUsers.Add(newChatPartner.Identifier);

            UserJoinMessage joinMessage = new UserJoinMessage()
            {
                SenderGuid = socketId,
                IsOriginOfMessage = false,
                ChatUser = newChatPartner
            };

            await InformUsersAboutJoin(joinMessage, _globalRoom);
        }

        /// <summary>
        /// Handles the action that a user leaves a room
        /// </summary>
        /// <param name="message"></param>
        /// <returns></returns>
        private async Task HandleUserLeavingRoom(UserLeaveMessage message)
        {
            ChatRoom room = _chatrooms[message.RoomIdentifier];
            //remove user from the room
            lock (_userRemovalLockObject)
            {
                room.ConnectedUsers.Remove(message.SenderGuid);
            }

            //delete the room if it's empty (the global room can't be removed)
            if (room.RoomIdentifier != 0 && room.ConnectedUsers.Count == 0)
            {
                lock(_userRemovalLockObject)
                {
                    _chatrooms.TryRemove(room.RoomIdentifier, out ChatRoom dummy);
                }   
            }

            await InformServerAboutLeavingUser(message);
        }

        /// <summary>
        /// Inform all users that a specific user has left a room/the server
        /// </summary>
        /// <param name="useridentifier"></param>
        /// <returns></returns>
        private async Task InformServerAboutLeavingUser(UserLeaveMessage message)
        {
            if(_chatrooms.TryGetValue(message.RoomIdentifier, out ChatRoom room))
            {
                string serialized = JsonConvert.SerializeObject(message, Global.SerializerSettings);
                await SendMessageIntoRoom(room, serialized);
            }
        }

        /// <summary>
        /// Inform all users about a joining user
        /// </summary>
        /// <param name="message"></param>
        /// <returns></returns>
        private async Task InformUsersAboutJoin(UserJoinMessage message, ChatRoom targetRoom)
        {
            //send the joining user his user name and all other users that he joined the server
            await Task.WhenAll(targetRoom.ConnectedUsers.Select(userKey =>
            {
                if(_sockets.TryGetValue(userKey, out ChatPartner user))
                {
                    message.IsOriginOfMessage = user.Identifier == message.SenderGuid;
                    string serialized = JsonConvert.SerializeObject(message, Global.SerializerSettings);

                    return SendStringAsync(user.WebSocket, user.Identifier, serialized, CancellationToken.None);
                }

                return Task.CompletedTask;
            }).ToArray());
        }

        /// <summary>
        /// Send server information to current chat partner
        /// </summary>
        /// <returns></returns>
        private async Task SendServerInformationToUser(WebSocket socket, string socketIdentifier)
        {
            ServerInformationMessage message = new ServerInformationMessage();
            message.UserDictionary = _sockets.ToDictionary(key => key.Key, value => value.Value);
            message.AvailableRooms = _chatrooms.ToDictionary(key => key.Key, value => value.Value);

            string serialized = JsonConvert.SerializeObject(message, Global.SerializerSettings);

            await SendStringAsync(socket, socketIdentifier, serialized, CancellationToken.None);
        }

        /// <summary>
        /// Create a new room thread-safe so that its identifier can't be used in multiple rooms at once
        /// </summary>
        /// <returns></returns>
        private ChatRoom CreateNewChatRoom(ChatRoom template = null)
        {
            int identifier = -1;
            lock (_chatRoomIdentifierCounter) {
                identifier = _chatRoomIdentifierCounter.CurrentIdentifier;
            }

            ChatRoom room = template ?? new ChatRoom(identifier);
            room.RoomIdentifier = identifier;

            _chatrooms.TryAdd(identifier, room);
            return room;
        }

        /// <summary>
        /// Removes a specific user from all chat rooms
        /// </summary>
        /// <param name="userIdentifier"></param>
        public async Task RemoveUserFromAllChatRooms(string userIdentifier)
        {
            foreach (var roomEntry in _chatrooms)
            {
                var room = roomEntry.Value;
                if (room.ConnectedUsers.Contains(userIdentifier))
                {
                    room.ConnectedUsers.Remove(userIdentifier);

                    await RemoveRoomIfEmpty(room);
                }
            }
        }

        /// <summary>
        /// Removes the given room if it's empty and informs the global room about the removal of the room
        /// </summary>
        /// <param name="room"></param>
        /// <returns></returns>
        public async Task RemoveRoomIfEmpty(ChatRoom room)
        {
            //delete the room if it's empty (the global room can't be removed)
            if (room.ConnectedUsers.Count == 0 && room.RoomIdentifier != 0)
            {
                lock (_userRemovalLockObject)
                {
                    //we can safely remove it within the foreach 'cause it's an concurrent-dictionary
                    _chatrooms.TryRemove(room.RoomIdentifier, out ChatRoom dummy);
                }

                //inform global room about deleted room
                RoomRemovalMessage message = new RoomRemovalMessage();
                message.RoomIdentifier = room.RoomIdentifier;

                string serialized = JsonConvert.SerializeObject(message, Global.SerializerSettings);
                await SendMessageIntoRoom(_globalRoom, serialized);
            }

        }

        /// <summary>
        /// Closes the user's websocket, removes him from the server and informs the other users that he is disconnected
        /// </summary>
        /// <param name="userIdentifier"></param>
        /// <returns></returns>
        public async Task DisconnectUserFromServer(string userIdentifier)
        {
            bool proceedWithDisconnect = false;
            ChatPartner user = null;
            lock (_userRemovalLockObject) {
                //the socket still has to be in our socket-dictionary and shouldn't be in the list of currently disconnecting users
                if(_sockets.TryRemove(userIdentifier, out user) && !_queuedUsersToDisconnect.Contains(userIdentifier))
                {
                    _queuedUsersToDisconnect.Add(userIdentifier);
                    proceedWithDisconnect = true;
                }
                else
                {
                    _queuedUsersToDisconnect.Remove(userIdentifier);
                }
            }
            
            if(proceedWithDisconnect)
            {
                try
                {
                    await RemoveUserFromAllChatRooms(userIdentifier);
                    Task closeTask = user.WebSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                    closeTask.Wait();
                    user.WebSocket.Dispose();
                }
                catch(Exception ex)
                {
                    //catch errors (if the closing of the socket fails)
                }

                UserLeaveMessage message = new UserLeaveMessage()
                {
                    RoomIdentifier = _globalRoom.RoomIdentifier,
                    SenderGuid = userIdentifier
                };

                await InformServerAboutLeavingUser(message);

                lock(_userRemovalLockObject)
                {
                    _queuedUsersToDisconnect.Remove(userIdentifier);
                }
            }
        }

        /// <summary>
        /// Pass string into a websocket
        /// </summary>
        /// <param name="socket"></param>
        /// <param name="data"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        private async Task SendStringAsync(WebSocket socket, string socketIdentifier, string data, CancellationToken cancellationToken = default(CancellationToken))
        {
            try
            {
                if (socket.State == WebSocketState.Open)
                {
                    //Temporary WORKAROUND! A websocket should only be accessed by one thread at a time, there could already be a outstanding SendAsync-process for this socket
                    //it'd be better to rewrite the message-sending system
                    lock (socket)
                    {
                        var buffer = Encoding.UTF8.GetBytes(data);
                        var segment = new ArraySegment<byte>(buffer);
                        Task sendTask = socket.SendAsync(segment, WebSocketMessageType.Text, true, cancellationToken);
                        sendTask.Wait();
                    }
                }
            }
            catch(Exception ex)
            {
                //either the socket was not connected/available anymore or there is already a outstanding SendAsync-process for this socket - don't disconnect the user then because in general he's able to receive a message
                //(the current messaging-system doesn't suit this case, a websocket should only be accessed by one thread at a time) - TODO!
                if (!ex.Message.Contains("Websockets_AlreadyOneOutstandingOperation"))
                {
                    await DisconnectUserFromServer(socketIdentifier);
                }
            }
        }

        /// <summary>
        /// Asynchronously receive a string from the websocket and return it
        /// </summary>
        /// <param name="socket"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        private async Task<string> ReceiveStringAsync(WebSocket socket, CancellationToken cancellationToken = default(CancellationToken))
        {
            var buffer = new ArraySegment<byte>(new byte[8192]);
            using (var memoryStream = new MemoryStream())
            {
                WebSocketReceiveResult result;
                do
                {
                    cancellationToken.ThrowIfCancellationRequested();

                    result = await socket.ReceiveAsync(buffer, cancellationToken);
                    memoryStream.Write(buffer.Array, buffer.Offset, result.Count);
                }
                while (!result.EndOfMessage);

                memoryStream.Seek(0, SeekOrigin.Begin);
                if (result.MessageType != WebSocketMessageType.Text)
                {
                    return null;
                }

                // Encoding UTF8: https://tools.ietf.org/html/rfc6455#section-5.6
                using (var reader = new StreamReader(memoryStream, Encoding.UTF8))
                {
                    return await reader.ReadToEndAsync();
                }
            }
        }

        #region Static Middleware Methods

        /// <summary>
        /// Returns a new nickname for a connecting user.
        /// If the user has requested a nickname, we will check whether the name is available.
        /// If the name is not available, we will append an increasing number till we found a name which is available.
        /// </summary>
        /// <returns></returns>
        private static string GetFreeNickname(string requestedNickname)
        {
            int counter = 0;

            while (!IsNicknameAvailable(requestedNickname + counter))
            {
                counter++;
            }

            return requestedNickname + counter;
        }

        /// <summary>
        /// Checks whether the nickname is available
        /// </summary>
        /// <param name="requestedName"></param>
        /// <returns></returns>
        private static bool IsNicknameAvailable(string requestedName)
        {
            string nameToLower = requestedName.ToLower();

            return !_sockets.Any(x => x.Value.Nickname.ToLower() == nameToLower);
        }

        #endregion Static Middleware Methods
    }
}
