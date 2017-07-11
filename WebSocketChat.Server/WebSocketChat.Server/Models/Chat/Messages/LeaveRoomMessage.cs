using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebSocketChat.Server.Models.Chat.Messages
{
    public class LeaveRoomMessage : Message
    {
        public LeaveRoomMessage()
        {
            MessageType = MessageType.LeaveRoom;
            Timestamp = DateTime.Now;
        }

        /// <summary>
        /// The identifier of the room - 0 = global room/server
        /// </summary>
        public int RoomIdentifier { get; set; }

        /// <summary>
        /// Specifies when the user did leave the server
        /// </summary>
        public DateTime Timestamp { get; set; }
    }
}
