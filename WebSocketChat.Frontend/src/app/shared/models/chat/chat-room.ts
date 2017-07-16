import { UserJoinMessage } from './messages/user-join-message';
import { ChatUser } from './chat-user';
import { NicknameRequest } from './messages/nickname-request';
import { UserLeaveMessage } from './messages/user-leave-message';
import { ChatMessage } from './messages/chat-message';

export class ChatRoom {
	/** Identifier of the room. The number 0 indicates the global server room. */
	roomIdentifier: number;

	/** Name of the chatroom */
	name: string;

	/** Description of the chatroom */
	description: string;	

	/** Indicates whether this is a private room with another user  */
	isPrivateRoom : boolean;

	/** Identifier-GUIDs of all users which have joined this room */
	connectedUsers: string[] = [];

	/** Indicates whether the room is password protected */
	isPasswordProtected: boolean;

	/** Client-side only properties which will not be send by the server */

	/** We will save all received messages in this array (client-side only) */
	messages: Array<ChatMessage | UserJoinMessage | UserLeaveMessage | NicknameRequest> = [];

	/** We will resolve all user-guids to actual chat user objects */
	connectedUsersResolved : Array<ChatUser> = [];

	/** Concatenated usernames of all users besides yourself */
	nicknameStringAggregation: string;
}