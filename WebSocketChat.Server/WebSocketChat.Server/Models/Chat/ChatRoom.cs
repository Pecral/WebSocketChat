using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebSocketChat.Server.Models.Chat
{
    public class ChatRoom
    {
        public ChatRoom(int roomIdentifier)
        {
            RoomIdentifier = roomIdentifier;
            ConnectedUsers = new List<string>();
        }


        /// <summary>
        /// Identifier of the room. 
        /// </summary>
        public int RoomIdentifier { get; set; }

        /// <summary>
        /// Name of the chatroom
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Description of the chatroom
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Base64 string representation of the room's avatar
        /// </summary>
        public string RoomAvatarBase64 { get; set; }

        /// <summary>
        /// Identifier-GUIDs of all users which have joined this room
        /// </summary>
        public List<string> ConnectedUsers { get; set; }

        /// <summary>
        /// Indicates whether this is a private room which is only used for 1v1 whisper-messages
        /// </summary>
        public bool IsPrivateRoom { get; set; }

        /// <summary>
        /// Optional password-protection. This property won't be serialized.
        /// </summary>
        public string Password { get; set; }

        /// <summary>
        /// Indicates whether the room is password protected
        /// </summary>
        public bool IsPasswordProtected => !string.IsNullOrWhiteSpace(Password);

        /// <summary>
        /// The password should never be serialized because it mustn't be send to the user.
        /// This method is only used by Json.NET
        /// </summary>
        public bool ShouldSerializePassword() => false;
    }
}
