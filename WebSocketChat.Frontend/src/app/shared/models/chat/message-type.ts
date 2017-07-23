export enum MessageType {
    None,
    ChatMessage,
    UserJoinMessage,
    UserLeaveMessage,

    RoomJoinRequest,
    RoomCreationRequest,
    RoomInformation,

    RequestConnections,
    ServerInformation,

    NicknameRequest,

    CustomNotificationMessage
}