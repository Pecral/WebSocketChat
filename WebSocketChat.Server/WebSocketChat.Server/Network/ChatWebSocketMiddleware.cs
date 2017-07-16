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

        private readonly RequestDelegate _next;

        public ChatWebSocketMiddleware(RequestDelegate next)
        {
            //create global room
            _globalRoom = CreateNewChatRoom();
            _globalRoom.Name = "Global Room";
            _globalRoom.IsPrivateRoom = false;

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
            await SendServerInformationToUser(currentSocket);

            while (true)
            {
                if (ct.IsCancellationRequested)
                {
                    break;
                }

                string response = null;

                try
                {
                    response = await ReceiveStringAsync(currentSocket, ct);
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

            try
            {
                _sockets.TryRemove(socketId, out dummy);

                await currentSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", ct);
                currentSocket.Dispose();
                await InformServerAboutLeavingUser(socketId, 0);
            }
            catch(Exception ex )
            {
                //sometimes it can happen that the removal of the websocket fails
            }
            finally
            {
                //ensure that he his removed from all rooms and the global dictionary
                RemoveUserFromAllChatRooms(socketId);
                _sockets.TryRemove(socketId, out dummy);
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

                    case MessageType.CreateRoomRequest:
                        CreateRoomRequest roomRequest = jsonMessage.ToObject<CreateRoomRequest>();
                        ChatRoom newRoom = CreateNewChatRoom(roomRequest.RequestedRoom);

                        await InviteUsersToRoom(newRoom);
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
                            await BroadcastString(JsonConvert.SerializeObject(nameRequest, Global.SerializerSettings));
                        }
                    break;
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

                    //inform the two users about the new room
                    await InviteUsersToRoom(targetRoom);
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
        private async Task InviteUsersToRoom(ChatRoom room)
        {
            RoomInformationMessage message = new RoomInformationMessage();
            message.ChatRoom = room;

            string serialized = JsonConvert.SerializeObject(message, Global.SerializerSettings);

            await SendMessageIntoRoom(room, serialized);
        }

        /// <summary>
        /// Broadcast a string to the whole server.
        /// </summary>
        /// <param name="message"></param>
        /// <returns></returns>
        private async Task BroadcastString(string message)
        {
            foreach (var socket in _sockets)
            {
                if (socket.Value.WebSocket.State != WebSocketState.Open)
                {
                    continue;
                }

                await SendStringAsync(socket.Value.WebSocket, message, CancellationToken.None);
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
            List<ChatPartner> roomUsers = new List<ChatPartner>();

            foreach (string userIdentifier in room.ConnectedUsers)
            {
                if(_sockets.TryGetValue(userIdentifier, out ChatPartner user))
                {
                    if (user.WebSocket.State != WebSocketState.Open)
                    {
                        continue;
                    }

                    await SendStringAsync(user.WebSocket, message, CancellationToken.None);
                }
            }
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

            await InformServerAboutJoin(joinMessage);
        }

        /// <summary>
        /// Inform all users that a specific user has left a room/the server
        /// </summary>
        /// <param name="useridentifier"></param>
        /// <returns></returns>
        private async Task InformServerAboutLeavingUser(string useridentifier, int roomIdentifier)
        {
            UserLeaveMessage message = new UserLeaveMessage()
            {
                RoomIdentifier = roomIdentifier,
                SenderGuid = useridentifier
            };

            //remove user from the room
            ChatRoom room = _chatrooms[roomIdentifier];
            room.ConnectedUsers.Remove(useridentifier);

            //if it's the global room, it means that he left the whole server --> we'll remove him from all rooms
            if(roomIdentifier == 0)
            {
                RemoveUserFromAllChatRooms(useridentifier);
            }

            //delete the room if it's empty (the global room can't be removed)
            if(room.RoomIdentifier != 0 && room.ConnectedUsers.Count == 0)
            {
                ChatRoom dummy;
                _chatrooms.TryRemove(room.RoomIdentifier, out dummy);
            }

            string serialized = JsonConvert.SerializeObject(message, Global.SerializerSettings);

            foreach (var socketGuid in room.ConnectedUsers)
            {
                if(_sockets.TryGetValue(socketGuid, out ChatPartner user))
                {
                    await SendStringAsync(user.WebSocket, serialized, CancellationToken.None);
                }
            }
        }

        /// <summary>
        /// Inform all users about the new user
        /// </summary>
        /// <param name="message"></param>
        /// <returns></returns>
        private async Task InformServerAboutJoin(UserJoinMessage message)
        {
            //send the joining user his user name and all other users that he joined the server
            foreach (var socket in _sockets)
            {
                message.IsOriginOfMessage = socket.Key == message.SenderGuid;
                string serialized = JsonConvert.SerializeObject(message, Global.SerializerSettings);

                await SendStringAsync(socket.Value.WebSocket, serialized, CancellationToken.None);
            }
        }

        /// <summary>
        /// Send server information to current chat partner
        /// </summary>
        /// <returns></returns>
        private async Task SendServerInformationToUser(WebSocket socket)
        {
            ServerInformationMessage message = new ServerInformationMessage();
            message.UserDictionary = _sockets.ToDictionary(key => key.Key, value => value.Value);
            message.AvailableRooms = _chatrooms.ToDictionary(key => key.Key, value => value.Value);

            string serialized = JsonConvert.SerializeObject(message, Global.SerializerSettings);

            await SendStringAsync(socket, serialized, CancellationToken.None);
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
        public void RemoveUserFromAllChatRooms(string userIdentifier)
        {
            foreach (var room in _chatrooms)
            {
                if (room.Value.ConnectedUsers.Contains(userIdentifier))
                {
                    room.Value.ConnectedUsers.Remove(userIdentifier);
                }
            }
        }

        #region Static Middleware Methods

        /// <summary>
        /// Pass string into a websocket
        /// </summary>
        /// <param name="socket"></param>
        /// <param name="data"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        private static Task SendStringAsync(WebSocket socket, string data, CancellationToken cancellationToken = default(CancellationToken))
        {
            try
            {
                if (socket.State == WebSocketState.Open)
                {
                    var buffer = Encoding.UTF8.GetBytes(data);
                    var segment = new ArraySegment<byte>(buffer);
                    return socket.SendAsync(segment, WebSocketMessageType.Text, true, cancellationToken);
                }
            }
            catch
            {
                //an exception could be thrown if the websocket is not available.. TODO: maybe we'll remove the target-websocket from the server
            }

            return null;
        }

        /// <summary>
        /// Asynchronously receive a string from the websocket and return it
        /// </summary>
        /// <param name="socket"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        private static async Task<string> ReceiveStringAsync(WebSocket socket, CancellationToken cancellationToken = default(CancellationToken))
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
