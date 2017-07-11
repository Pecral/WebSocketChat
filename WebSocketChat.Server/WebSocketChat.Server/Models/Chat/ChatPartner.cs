using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Threading.Tasks;

namespace WebSocketChat.Server.Models.Chat
{
    public class ChatPartner
    {
        [JsonIgnore]
        public WebSocket WebSocket { get; set; }

        /// <summary>
        /// The user's GUID-Identifier
        /// </summary>
        public string Identifier { get; set; }
        
        /// <summary>
        /// Nickname of the user
        /// </summary>
        public string Nickname { get; set; }

        /// <summary>
        /// Base64-string representation of the user's avatar
        /// </summary>
        public string AvatarBase64 { get; set; }
    }
}
