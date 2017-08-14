using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebSocketChat.Server.Models.Chat
{
    public enum MessageType
    {
        None,
        ChatMessage,
        UserJoinMessage,
        UserLeaveMessage,

        RoomJoinRequest,
        RoomCreationRequest,
        RoomRemovalMessage,
        RoomInformation,

        RequestConnections,
        ServerInformation,

        NicknameRequest,

        CustomNotificationMessage
    }
}
