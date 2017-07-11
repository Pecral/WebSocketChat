import { Message, MessageIdentifier } from '../message';
import { MessageType } from '../message-type';

export class LeaveRoomMessage extends MessageIdentifier implements Message {
	
	messageType: MessageType = MessageType.LeaveRoom;

	/** The identifier of the room that the user has left. RoomIdentifier = 0 indicates that it was the server. */
	roomIdentifier: number;
}