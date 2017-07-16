using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebSocketChat.Server.Models.Chat.Messages
{
    public class ServerInformationMessage : Message
    {
        public ServerInformationMessage()
        {
            MessageType = MessageType.ServerInformation;
        }

        public Dictionary<string, ChatPartner> UserDictionary { get; set; }

        public Dictionary<int, ChatRoom> AvailableRooms { get; set; }
    }
}
