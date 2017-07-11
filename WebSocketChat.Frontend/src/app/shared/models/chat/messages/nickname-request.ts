import { MessageType } from '../message-type';
import { Message, MessageIdentifier } from './../message';
export class NicknameRequest extends MessageIdentifier implements Message {

	messageType : MessageType = MessageType.NicknameRequest;

	/**The user's requested nickname */
	requestedNickname: string;

	/**Indicates whether the nickname-request was successful */
	wasSuccessful: boolean;

	/** If the user has changed his/her nickname, the old nickname will be saved here (clientside only) */
	oldNickname: string;
}
	