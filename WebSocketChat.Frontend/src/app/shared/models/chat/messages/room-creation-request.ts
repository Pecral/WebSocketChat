import { ChatRoom } from './../chat-room';
import { MessageIdentifier, Message } from './../message';
import { MessageType } from "app/shared/models/chat/message-type";

   /**This class is a proxy class for the case that a user wants to create a new room.
 *We don't need to declare all of the room's properties in this class, but we can use the ChatRoom class itself. */
   export class RoomCreationRequest extends MessageIdentifier implements Message {

      messageType : MessageType = MessageType.RoomCreationRequest;

      /**The requested room */
      requestedRoom: ChatRoom;
   }