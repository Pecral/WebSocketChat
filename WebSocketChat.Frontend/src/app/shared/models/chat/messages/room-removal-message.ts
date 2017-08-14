import { ChatRoom } from './../chat-room';
import { MessageIdentifier, Message } from './../message';
import { MessageType } from "app/shared/models/chat/message-type";


export class RoomRemovalMessage{

   messageType : MessageType = MessageType.RoomRemovalMessage;

   /**The removed room's identifier */
   roomIdentifier: number;
}