import { ChatStorageService } from './../../../shared/settings/chat-storage.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';

import { Observable } from 'rxjs';
import { Subject, Subscription } from 'rxjs/Rx';

import { NgxAutoScroll } from 'ngx-auto-scroll/lib/ngx-auto-scroll.directive';
import { ChatUser } from './../../../shared/models/chat/chat-user';
import { ChatMessage } from './../../../shared/models/chat/messages/chat-message';
import { NicknameRequest } from './../../../shared/models/chat/messages/nickname-request';
import { ChatRoom } from './../../../shared/models/chat/chat-room';
import { MessageType } from "./../../../shared/models/chat/message-type";
import { PasswordRequestNotificationComponent } from './../notification/password-request-notification/password-request-notification.component';

import { NavigationService } from './../../../shared/settings/navigation.service';
import { ChatService } from './../../../shared/services/websocket-chat.service';

@Component({
   selector: 'chat-room',
   templateUrl: './chat-room.component.html',
   styleUrls: ['./chat-room.component.scss']
})
export class ChatRoomComponent implements OnInit {

   _chatRoom: ChatRoom;
   @Input()
   set chatRoom(value: ChatRoom) {
      //unsubscribe from old subscription
      if (this.joinRequestSubscription) {
         this.joinRequestSubscription.unsubscribe();
      }

      this._chatRoom = value;

      if (this.chatRoom.isPasswordProtected) {
         this.joinRequestSubscription = this.chatRoom.failedJoinRequest.subscribe(x => {
            if (!this.chatRoom.hasJoinedRoom && this.passwordRequestNotification) {
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

   @ViewChild(PasswordRequestNotificationComponent) passwordRequestNotification: PasswordRequestNotificationComponent;

   /** proxy so that we can access the enum in our html-file */
   messageType: any = MessageType;

   currentMessage: string;

   /** Indicates whether the menu should be in its detailed mode where all nicknames which exist in the room are displayed */
   detailedMenu: boolean;

   /** If this a password protected room, we will send a information that the user has to type in a password (but only once) */
   private hasSendPasswordRequest: boolean;

   constructor(
      private route: ActivatedRoute,
      private router: Router,
      private chatService: ChatService,
      private navigation: NavigationService,
      public chatStorage: ChatStorageService) {
   }

   ngOnInit() {
      this.route.params.subscribe(params => {
         let roomIdentifier = +params['id'];
         this.loadRoom(roomIdentifier);
      });
   }

   /** Loads a chatroom */
   private loadRoom(roomIdentifier: number): void {
      let redirectToGlobalRoom = true;
      if (this.chatService.roomDictionary.has(roomIdentifier)) {
         this.chatRoom = this.chatService.roomDictionary.get(roomIdentifier);
         
         //we can't join private rooms directly..
         if (!this.chatRoom.isPrivateRoom) {
            redirectToGlobalRoom = false;
            this.navigation.currentRoom = this.chatRoom;
            this.navigation.chatIsActiveWindow = true;

            //start join request if we're not already joined
            if (!this.chatRoom.hasJoinedRoom) {
               this.chatService.startRoomJoinRequest(this.chatRoom.roomIdentifier, "");
            }
         }
      }

      if (redirectToGlobalRoom) {
         //use global room as a fallback
         this.router.navigate(['/chatroom', this.chatService.globalRoom.roomIdentifier]);
      }
   }

   /** Checks whether a specific nickname is currently available */
   private isNicknameAvailable(requestedNickname: string):boolean {
      let isAvailable : boolean = true;
      let nicknameToLower = requestedNickname.toLowerCase();

      this.chatService.userDictionary.forEach((value:ChatUser, key: string) => {
         if(value.nickname.toLowerCase() == nicknameToLower) {
            isAvailable = false;
         }
      });

      return isAvailable;
   }   


   /** Send a new chat message to the server */
   public sendMessage(message: string) {

      if (message && message != "") {
         if (message.toLowerCase().startsWith("/identify")) {
            let whitespaceIndex = message.indexOf(" ");
            let nickname = message.substring(whitespaceIndex, message.length);
            nickname = nickname.trim();

            if (nickname && nickname != "" && this.isNicknameAvailable(nickname)) {
               let nicknameRequest: NicknameRequest = new NicknameRequest();
               nicknameRequest.requestedNickname = nickname;
               this.chatService.sendMessage(nicknameRequest);
            }
         }
         else if(!this.chatRoom.hasJoinedRoom) {
            //if we didn't join the room yet, all messages will be seen as passwords which are used to connect into the room
            this.chatService.startRoomJoinRequest(this.chatRoom.roomIdentifier, message);
         }
         else {             
            let messageModel: ChatMessage = new ChatMessage();
            messageModel.message = message;
            messageModel.timestamp = new Date();
            messageModel.roomIdentifier = this.chatRoom.roomIdentifier;

            this.chatService.sendMessage(messageModel);            
         }
      }

      //clear current message in input field
      this.currentMessage = "";
   }

   /** Move back to room-overview */
   triggerNavigateToRoomOverview(): void {
      this.navigation.chatIsActiveWindow = false;
   }

}