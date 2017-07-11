import { MessageType } from "app/shared/models/chat/message-type";

export interface Message {
    messageType : MessageType;
}

export class MessageIdentifier {
    /** Identification GUID of the sender */
    senderGuid : string;

    /** Timestamp when the message was sent */
    timestamp : Date;
}