import { NicknameRequest } from './../../shared/models/chat/messages/nickname-request';
import { ChatUser } from './../../shared/models/chat/chat-user';
import { TestService } from './../../shared/services/test.service';
import { LeaveRoomMessage } from './../../shared/models/chat/messages/user-leave-message';
import { CustomJsonDeserializer } from './../../shared/helper/CustomJsonDeserializer';
import { ServerInformationMessage } from './../../shared/models/chat/messages/server-information-message';
import { UserIdentifierMessage } from './../../shared/models/chat/messages/user-identifier-message';
import { MessageType } from './../../shared/models/chat/message-type';
import { WebsocketService } from './../../shared/services/websocket-chat.service';
import { ChatMessage } from './../../shared/models/chat/messages/chat-message';
import { Message } from './../../shared/models/chat/message';

import { Subject, Subscription } from 'rxjs/Rx';

import { ChatMessageComponent } from './message/chat-message.component';
import { Component, OnInit, QueryList, ViewChildren, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

	static notificationTypes  = [UserIdentifierMessage, LeaveRoomMessage, NicknameRequest];

	private socket: Subject<any>;
	
	messages: Array<ChatMessage | UserIdentifierMessage | LeaveRoomMessage | NicknameRequest> = [];
	nickname: string;
	identifier: string;
	userDictionary: Map<string, ChatUser> = new Map<string, ChatUser>();

	currentMessage: string;

	nicknamesAggregation : string;
	messageType : any = MessageType;

	@ViewChild('chatWrapper') private chatWrapper: ElementRef;

	constructor(webSocketService: WebsocketService, testService : TestService) {
		console.log("app-chat");
		this.socket = webSocketService.createWebsocket();
	}

	ngOnInit() {
		this.socket.subscribe(message => {
			if (message instanceof MessageEvent) {
				this.handleMessage(CustomJsonDeserializer.deserialize(message.data));
			}
		});
	}

	/** Send a new chat message to the server */
	public sendMessage(message: string) {
		if(message && message != "") {
			if (message.startsWith("/identify ")) {
				let whitespaceIndex = message.indexOf(" ");
				let nickname = message.substring(whitespaceIndex, message.length);
				nickname = nickname.trim();

				if (nickname && nickname != "" && this.isNicknameAvailable(nickname) ) {
					let nicknameRequest: NicknameRequest = new NicknameRequest();
					nicknameRequest.requestedNickname = nickname;
					this.socket.next(nicknameRequest);
				}
			}
			else {
				let messageModel: ChatMessage = new ChatMessage();
				messageModel.message = message;
				messageModel.timestamp = new Date();
				messageModel.nickname = this.nickname;

				this.socket.next(messageModel);
			}
		}

		//clear current message in input field
		this.currentMessage = "";
	}

	/** Scroll to the last chat message  */
	scrollToBottom(): void {
		// $('.chat-messages').animate({
		// 	scrollTop:$('.chat li:last').offset().top
		// }, 300);

		// try {
		// 	this.chatWrapper.nativeElement.scrollTop = this.chatWrapper.nativeElement.scrollHeight;
		// } catch (err) { }
	}

	/** Handles a message which was received through the websocket */
	private handleMessage(messageData : any):void {
		let messageModel = messageData as Message;

		if(messageModel.messageType != undefined) {
			switch(messageModel.messageType) {
				case MessageType.ChatMessage:
					let chatMessage = Object.assign(new ChatMessage(), messageModel);
					if(this.userDictionary.has(chatMessage.senderGuid)) {
						chatMessage.nickname = this.userDictionary.get(chatMessage.senderGuid).nickname;
					}
					
					this.messages.push(chatMessage);
					this.scrollToBottom();
				break;

				case MessageType.UserIdentifier:
					let joinMessage = Object.assign(new UserIdentifierMessage(), messageModel);
					//if we are the user who joined, we will set the guid and the nickname
					if(joinMessage.isOriginOfMessage) {
						this.nickname = joinMessage.chatUser.nickname;
						this.identifier = joinMessage.chatUser.identifier;
						console.log(`Assigned nickname ${this.nickname} - identifier ${this.identifier}`);
					}

					this.userDictionary.set(joinMessage.chatUser.identifier, joinMessage.chatUser);
					this.updateNicknameStringAggregation();
					this.messages.push(joinMessage);
				break;

				case MessageType.ServerInformation:
					let serverInformation = Object.assign(new ServerInformationMessage(), messageModel);
					for(let userKey in serverInformation.userDictionary) {
						this.userDictionary.set(userKey, serverInformation.userDictionary[userKey]);
					}
					this.updateNicknameStringAggregation();
				break;

				case MessageType.LeaveRoom:
					let leaveRoomMessage = Object.assign(new LeaveRoomMessage(), messageModel);
					leaveRoomMessage.nickname = this.userDictionary.get(leaveRoomMessage.senderGuid).nickname;
					//remove user from dictionary
					this.userDictionary.delete(leaveRoomMessage.senderGuid);
					this.messages.push(leaveRoomMessage);
					this.updateNicknameStringAggregation();
				break;

				case MessageType.NicknameRequest:
					let nicknameRequest = Object.assign(new NicknameRequest(), messageModel);

					if(nicknameRequest.wasSuccessful) {
						nicknameRequest.oldNickname = this.userDictionary.get(nicknameRequest.senderGuid).nickname;

						if(nicknameRequest.senderGuid == this.identifier) {
							this.nickname = nicknameRequest.requestedNickname;
						}

						this.userDictionary.get(nicknameRequest.senderGuid).nickname = nicknameRequest.requestedNickname;
						this.messages.push(nicknameRequest);
						this.updateNicknameStringAggregation();
					}
				break;
			}
		}
	}

	/** Checks whether a specific nickname is currently available */
	private isNicknameAvailable(requestedNickname: string):boolean {
		let isAvailable : boolean = true;
		let nicknameToLower = requestedNickname.toLowerCase();

		this.userDictionary.forEach((value:ChatUser, key: string) => {
			if(value.nickname.toLowerCase() == nicknameToLower) {
				isAvailable = false;
			}
		});

		return isAvailable;
	}

	/** Updates the aggregatio-string of all nicknames which are currently connected to the server */
	private updateNicknameStringAggregation():void {
		this.nicknamesAggregation = "";
		this.userDictionary.forEach((value:ChatUser, key: string) => {
			if(key != this.identifier) {
				this.nicknamesAggregation += ", " + value.nickname;
			}
		});
	}

	/** Returns true if the given message is a notification-message */
   isNotificationMessage(message: Message): boolean {
      return ChatComponent.notificationTypes.some(type => message instanceof type);
  	}
}