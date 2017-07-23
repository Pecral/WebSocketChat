/** Angular */
import { Component, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs/Rx';

/** Models */
import { Message } from './../../shared/models/chat/message';
import { ChatMessage } from './../../shared/models/chat/messages/chat-message';
import { ChatUser } from './../../shared/models/chat/chat-user';
import { ChatRoom } from './../../shared/models/chat/chat-room';
import { NicknameRequest } from './../../shared/models/chat/messages/nickname-request';

/** Services */
import { ChatService } from './../../shared/services/websocket-chat.service';

@Component({
   selector: 'app-chat',
   templateUrl: './chat.component.html',
   styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
   //proxy methods to acess service properties
   userDictionary: Map<string, ChatUser>;
   roomList : Array<ChatRoom> = [];
   currentRoom: ChatRoom;

   selfIdentifier: ChatUser = new ChatUser();

   chatIsActiveWindow:boolean = true;

   constructor(private chatService: ChatService) {

   }

   ngOnInit() {
      this.userDictionary = this.chatService.userDictionary;
      this.roomList = this.chatService.roomList;
      this.currentRoom = this.chatService.globalRoom;
      this.chatService.selfIdentifierChanged.subscribe((identification : ChatUser) => {
         this.selfIdentifier = identification;
      });
   }

   /** Proxy method to pass messages to the webservice */
   sendMessage(message: ChatMessage | NicknameRequest):void {
      //if we didn't join the room yet, all messages will be seen as passwords which are used to connect into the room
      if(!this.currentRoom.hasJoinedRoom && message instanceof ChatMessage) {
         this.chatService.startRoomJoinRequest(this.currentRoom.roomIdentifier, message.message);
      }
      else if(message instanceof ChatMessage || this.isNicknameAvailable(message.requestedNickname)) {
         this.chatService.sendMessage(message);
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

   /** Navigate to chatroom  */
   navigateToRoom(room: ChatRoom) {
      this.currentRoom = room;
      this.chatIsActiveWindow = true

      if(!room.hasJoinedRoom) {
         this.chatService.startRoomJoinRequest(room.roomIdentifier, "");
      }
   }
}