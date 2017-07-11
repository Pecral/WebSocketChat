using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebSocketChat.Server.Models.Chat.Messages
{
    public class ChatMessage : Message
    {
        public ChatMessage()
        {
            MessageType = MessageType.ChatMessage;
            Timestamp = DateTime.Now;
        }

        /// <summary>
        /// Timestamp when the message was received from the user
        /// </summary>
        public DateTime Timestamp { get; set; }

        /// <summary>
        /// The ID of the recipient
        /// </summary>
        public string Recipient { get; set; }

        /// <summary>
        /// If the message is sent in a chatroom, this message will be set
        /// </summary>
        public string Room { get; set; }

        /// <summary>
        /// Content of the message
        /// </summary>
        public string Content { get; set; }
    }
}
