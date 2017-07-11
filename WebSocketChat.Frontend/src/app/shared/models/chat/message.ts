import { MessageType } from "../../models/chat/message-type";

export interface Message {
    messageType : MessageType;
}

export class MessageIdentifier {
    /** Identification GUID of the sender */
    senderGuid : string;

    /** Timestamp when the message was sent */
    timestamp : Date;

    /** Every sender-guid represents either a user or the server himself. We will lookup the name of the server and automatically set this property for every received message */
    senderName : string;
}