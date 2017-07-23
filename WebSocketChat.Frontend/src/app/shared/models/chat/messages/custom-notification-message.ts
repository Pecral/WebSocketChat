import { MessageType } from 'app/shared/models/chat/message-type';
import { MessageIdentifier, Message } from './../message';

/** Generic notification message */
export class CustomNotificationMessage extends MessageIdentifier implements Message {
   messageType: MessageType = MessageType.CustomNotificationMessage;

   /** The message itself */
   message: string;

   /** The room identifier to which this message should be posted  */
   roomIdentifier: string;
}
