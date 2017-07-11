import { ChatUser } from './../chat-user';
import { Message, MessageIdentifier } from '../message';
import { MessageType } from '../message-type';

export class UserIdentifierMessage extends MessageIdentifier implements Message {
	messageType : MessageType = MessageType.UserIdentifier;

	/**Indicates whether the user to whom this message is send to is the one who caused this message (he joined the server, changed his nickname etc.) */
	isOriginOfMessage: boolean;

	/**The user that has joined the room/server */
	chatUser: ChatUser;
}