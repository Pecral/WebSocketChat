import { Subject } from 'rxjs/Rx';
import { EventEmitter } from '@angular/core';

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

	/** Base64 string representation of the room's avatar */
	roomAvatarBase64: string = "";

	/** Client-side only properties which will not be send by the server */

	/** We will save all received messages in this array (client-side only) */
	messages: Array<ChatMessage | UserJoinMessage | UserLeaveMessage | NicknameRequest> = [];

	/** The timestamp of the last message in this room */
	lastMessageTimestamp: Date;

	/** We will resolve all user-guids to actual chat user objects */
	connectedUsersResolved : Array<ChatUser> = [];

	/** Concatenated usernames of all users besides yourself */
	nicknameStringAggregation: string;

	/** Specifies whether the user has already joined the room */
	hasJoinedRoom: boolean;

	/** If the user fails to type in the correct password to join the room, we will fire this event so that the UI can react.. */
	failedJoinRequest: Subject<any> = new Subject();
}