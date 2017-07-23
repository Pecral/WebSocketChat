import { PasswordRequestNotificationComponent } from './../notification/password-request-notification/password-request-notification.component';
import { Observable } from 'rxjs';
import { Subject, Subscription } from 'rxjs/Rx';
import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { NgxAutoScroll } from 'ngx-auto-scroll/lib/ngx-auto-scroll.directive';
import { ChatUser } from './../../../shared/models/chat/chat-user';
import { ChatMessage } from './../../../shared/models/chat/messages/chat-message';
import { NicknameRequest } from './../../../shared/models/chat/messages/nickname-request';
import { ChatRoom } from './../../../shared/models/chat/chat-room';
import { MessageType } from "./../../../shared/models/chat/message-type";

@Component({
   selector: 'chat-room',
   templateUrl: './chat-room.component.html',
   styleUrls: ['./chat-room.component.scss']
})
export class ChatRoomComponent implements OnInit {

   @Output()
   messageSend: EventEmitter<ChatMessage | NicknameRequest> = new EventEmitter<ChatMessage | NicknameRequest>();

   @Output()
   navigateToRoomOverview: EventEmitter<any> = new EventEmitter<any>();   

   @Input()
   selfIdentifier: ChatUser = new ChatUser();   

   _chatRoom: ChatRoom;
   @Input()
   set chatRoom(value: ChatRoom) {
      //unsubscribe from old subscription
      if(this.joinRequestSubscription) {
         this.joinRequestSubscription.unsubscribe();
      }

      this._chatRoom = value;

      if(this.chatRoom.isPasswordProtected) {
         this.joinRequestSubscription = this.chatRoom.failedJoinRequest.subscribe(x => {
            if(!this.chatRoom.hasJoinedRoom && this.passwordRequestNotification) {
               this.passwordRequestNotification.triggerHeartbeat();
            }
         });
      }
   }
   get chatRoom(): ChatRoom {
      return this._chatRoom;
   }

   /** This is the subscription to failed join requests of a room (e.g. when the user types in a wrong password) */
   joinRequestSubscription: Subscription;

   @ViewChild(PasswordRequestNotificationComponent) passwordRequestNotification : PasswordRequestNotificationComponent;

   /** proxy so that we can access the enum in our html-file */
   messageType: any = MessageType;

   currentMessage: string;

   /** Indicates whether the menu should be in its detailed mode where all nicknames which exist in the room are displayed */
   detailedMenu: boolean;

   /** If this a password protected room, we will send a information that the user has to type in a password (but only once) */
   private hasSendPasswordRequest:boolean;

   constructor() {
   }

   ngOnInit() { 

   }

   /** Send a new chat message to the server */
   public sendMessage(message: string) {

      if (message && message != "") {
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

   /** Move back to room-overview */
   triggerNavigateToRoomOverview(): void {
      this.navigateToRoomOverview.next();
   }

   joinRoom():void {
      
   }

}