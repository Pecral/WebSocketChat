import { Message, MessageIdentifier } from '../message';
import { MessageType } from '../message-type';

export class ChatMessage extends MessageIdentifier implements Message {
  
  messageType : MessageType = MessageType.ChatMessage;
  
  /** The avatar of the user - NOT SUPPORTED YET. This has to be moved to another place anyway (maybe to the user identifier message. */
  avatarSourceUrl: string = "https://i.imgur.com/DY6gND0.png"; //default

  /** The actual message */
  message : string;

  /** The nickname of the user who posted this message (not sent by the server because it can be extracted from the user dictionary) */
  nickname : string;
  
  /** The room where the message was posted */
  room : string;
}