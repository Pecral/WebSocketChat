import { MessageType } from 'app/shared/models/chat/message-type';
import { MessageIdentifier, Message } from './../message';

export class RoomJoinRequest extends MessageIdentifier implements Message  {

    constructor(isSuccessful?:boolean) { super(); }

    messageType : MessageType = MessageType.RoomJoinRequest;

    /**The requested room's identifier */
    roomIdentifier: number;

    /**Supplied password (if it's needed) */
    password: string;

    /**This boolean indicates whether the join-request was successful */
    isSuccessful: boolean;
}