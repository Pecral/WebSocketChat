using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebSocketChat.Server.Models.Chat.Messages
{
    public class RoomInformationMessage : Message
    {
        public RoomInformationMessage()
        {
            this.MessageType = MessageType.RoomInformation;
        }

        public ChatRoom ChatRoom { get; set; }
    }
}
