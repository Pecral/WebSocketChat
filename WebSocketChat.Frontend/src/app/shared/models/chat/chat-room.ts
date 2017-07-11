export class ChatRoom {
	/** Identifier of the room. The number 0 indicates the global server room. */
	roomIdentifier: number;

	/**Name of the chatroom */
	name: string;

	/**Description of the chatroom */
	description: string;	

	/** Indicates whether this is a private room with another user  */
	isPrivateRoom : boolean;

	/** Identifier-GUIDs of all users which have joined this room */
	connectedUsers: string[];

	/**Indicates whether the room is password protected */
	isPasswordProtected: boolean;
}