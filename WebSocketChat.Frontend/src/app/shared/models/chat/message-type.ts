export enum MessageType {
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