﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebSocketChat.Server.Models.Chat.Messages
{
    public class UserIdentifierMessage : Message
    {
        public UserIdentifierMessage()
        {
            MessageType = MessageType.UserIdentifier;
            Timestamp = DateTime.Now;
        }

        /// <summary>
        /// Specifies when the identification did happen (when did the user has joined the server etc.)
        /// </summary>
        public DateTime Timestamp { get; set; }

        /// <summary>
        /// Indicates whether the user to whom this message is send to is the one who caused this message (he joined the server, changed his nickname etc.)
        /// </summary>
        public bool IsOriginOfMessage { get; set; }

        /// <summary>
        /// The user that has joined the room/server
        /// </summary>
        public ChatPartner ChatUser { get; set; }
    }
}
