using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Concurrent;
using System.IO;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using WebSocketChat.Server.Common;
using WebSocketChat.Server.Models.Chat;
using WebSocketChat.Server.Models.Chat.Messages;

namespace WebSocketChat.Server.Network
{
    public class ChatWebSocketMiddleware
    {
        private static ConcurrentDictionary<string, ChatPartner> _sockets = new ConcurrentDictionary<string, ChatPartner>();
        private static ConcurrentDictionary<int, ChatRoom> _chatrooms = new ConcurrentDictionary<int, ChatRoom>();

        private readonly RequestDelegate _next;

        public ChatWebSocketMiddleware(RequestDelegate next)
        {
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
                
                try
                {
                    var response = await ReceiveStringAsync(currentSocket, ct);

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
                catch{ }
            }

            _sockets.TryRemove(socketId, out dummy);

            await currentSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", ct);
            currentSocket.Dispose();
            await InformServerAboutLeave(socketId);
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
                        await BroadcastString(jsonMessage.ToString());
                    break;

                    case MessageType.NicknameRequest:
                        NicknameRequest request = jsonMessage.ToObject<NicknameRequest>();
                        request.WasSuccessful = false;
                        lock (_sockets)
                        {
                            if (IsNicknameAvailable(request.RequestedNickname))
                            {
                                request.WasSuccessful = true;
                                _sockets.FirstOrDefault(x => x.Key == socketId).Value.Nickname = request.RequestedNickname;
                            }
                        }

                        if(request.WasSuccessful)
                        {
                            await BroadcastString(JsonConvert.SerializeObject(request, Global.SerializerSettings));
                        }
                    break;
                }
            }
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

            UserIdentifierMessage joinMessage = new UserIdentifierMessage()
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
        private async Task InformServerAboutLeave(string useridentifier)
        {
            LeaveRoomMessage message = new LeaveRoomMessage()
            {
                RoomIdentifier = 0,
                SenderGuid = useridentifier
            };

            string serialized = JsonConvert.SerializeObject(message, Global.SerializerSettings);
            foreach (var socket in _sockets)
            {
                await SendStringAsync(socket.Value.WebSocket, serialized, CancellationToken.None);
            }
        }

        /// <summary>
        /// Inform all users about the new user
        /// </summary>
        /// <param name="message"></param>
        /// <returns></returns>
        private async Task InformServerAboutJoin(UserIdentifierMessage message)
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

            string serialized = JsonConvert.SerializeObject(message, Global.SerializerSettings);

            await SendStringAsync(socket, serialized, CancellationToken.None);
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
            var buffer = Encoding.UTF8.GetBytes(data);
            var segment = new ArraySegment<byte>(buffer);
            return socket.SendAsync(segment, WebSocketMessageType.Text, true, cancellationToken);
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
