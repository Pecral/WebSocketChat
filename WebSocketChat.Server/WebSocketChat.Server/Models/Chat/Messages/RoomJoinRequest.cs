using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebSocketChat.Server.Models.Chat.Messages
{
    public class RoomJoinRequest : Message
    {
        public RoomJoinRequest()
        {
            MessageType = MessageType.RoomJoinRequest;
        }

        /// <summary>
        /// The requested room's identifier
        /// </summary>
        public int RoomIdentifier { get; set; }

        /// <summary>
        /// Supplied password (if it's needed)
        /// </summary>
        public string Password { get; set; }

        /// <summary>
        /// This boolean indicates whether the join-request was successful
        /// </summary>
        public bool IsSuccessful { get; set; }
    }
}
