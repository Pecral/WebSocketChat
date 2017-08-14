using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebSocketChat.Server.Models.Chat.Messages
{
    public class RoomRemovalMessage : Message
    {
        public RoomRemovalMessage()
        {
            MessageType = MessageType.RoomRemovalMessage;
        }

        /// <summary>
        /// Room identifier of the removed room
        /// </summary>
        public int RoomIdentifier { get; set; }
    }
}
