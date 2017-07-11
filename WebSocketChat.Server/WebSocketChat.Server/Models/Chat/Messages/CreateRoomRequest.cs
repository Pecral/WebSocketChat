using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebSocketChat.Server.Models.Chat.Messages
{
    /// <summary>
    /// This class is a proxy class for the case that a user wants to create a new room.
    /// We don't need to declare all of the room's properties in this class, but we can use the ChatRoom class itself.
    /// </summary>
    public class CreateRoomRequest : Message
    {
        /// <summary>
        /// The requested room
        /// </summary>
        public ChatRoom RequestedRoom { get; set; }
    }
}
