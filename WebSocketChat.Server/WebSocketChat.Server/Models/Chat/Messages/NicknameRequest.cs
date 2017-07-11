using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebSocketChat.Server.Models.Chat.Messages
{
    public class NicknameRequest : Message
    {
        public NicknameRequest()
        {
            MessageType = MessageType.NicknameRequest;
            Timestamp = DateTime.Now;
        }

        /// <summary>
        /// Timestamp when the name was requested
        /// </summary>
        public DateTime Timestamp { get; set; }

        /// <summary>
        /// The user's requested nickname
        /// </summary>
        public string RequestedNickname { get; set; }

        /// <summary>
        /// Indicates whether the nickname-request was successful
        /// </summary>
        public bool WasSuccessful { get; set; }
    }
}
