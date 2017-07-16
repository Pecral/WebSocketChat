import { ChatUser } from './../../../shared/models/chat/chat-user';
import { ChatMessage } from './../../../shared/models/chat/messages/chat-message';
import { NicknameRequest } from './../../../shared/models/chat/messages/nickname-request';
import { ChatRoom } from './../../../shared/models/chat/chat-room';
import { MessageType } from "./../../../shared/models/chat/message-type";
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.css']
})
export class ChatRoomComponent implements OnInit {

  @Output()
  messageSend : EventEmitter<ChatMessage | NicknameRequest> = new EventEmitter<ChatMessage | NicknameRequest>();

  @Input()
  chatRoom : ChatRoom;

  @Input()
  selfIdentifier : ChatUser = new ChatUser();

  /** proxy so that we can access the enum in our html-file */
  messageType : any = MessageType;

  currentMessage: string;

  /** Indicates whether the menu should be in its detailed mode where all nicknames which exist in the room are displayed */
  detailedMenu: boolean;
  
  constructor() { }

  ngOnInit() {
  }

   /** Send a new chat message to the server */
   public sendMessage(message: string) {
      if(message && message != "") {
         if (message.toLowerCase().startsWith("/identify")) {
            let whitespaceIndex = message.indexOf(" ");
            let nickname = message.substring(whitespaceIndex, message.length);
            nickname = nickname.trim();

            if (nickname && nickname != "") {
               let nicknameRequest: NicknameRequest = new NicknameRequest();
               nicknameRequest.requestedNickname = nickname;
               this.messageSend.next(nicknameRequest);
            }
         }
         else {
            let messageModel: ChatMessage = new ChatMessage();
            messageModel.message = message;
            messageModel.timestamp = new Date();
            messageModel.roomIdentifier = this.chatRoom.roomIdentifier;

            this.messageSend.next(messageModel);
         }
      }

      //clear current message in input field
      this.currentMessage = "";
   }  

}