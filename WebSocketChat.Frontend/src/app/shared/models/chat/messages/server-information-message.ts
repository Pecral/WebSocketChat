import { ChatRoom } from './../chat-room';
import { ChatUser } from './../chat-user';
import { Message, MessageIdentifier } from '../message';
import { MessageType } from '../message-type';

export class ServerInformationMessage extends MessageIdentifier implements Message {

	messageType : MessageType = MessageType.ServerInformation;

	/** A guid-to-chatpartner dictionary of all users which are connected to the server */
	userDictionary: { [key: string]: ChatUser };

	/** Dictionary of all available chatrooms  */
	availableRooms: { [key: number]: ChatRoom };
}