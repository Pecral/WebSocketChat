
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
import { NavigationService } from './../../shared/settings/navigation.service';

@Component({
   selector: 'app-chat',
   templateUrl: './chat.component.html',
   styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
   //proxy methods to acess service properties
   userDictionary: Map<string, ChatUser>;
   roomList : Array<ChatRoom> = [];
   
   selfIdentifier: ChatUser = new ChatUser();

   constructor(
      private chatService: ChatService,
      public navigation: NavigationService) {

   }

   ngOnInit() {
      this.userDictionary = this.chatService.userDictionary;
      this.roomList = this.chatService.roomList;
      this.navigation.currentRoom = this.chatService.globalRoom;
      this.chatService.selfIdentifierChanged.subscribe((identification : ChatUser) => {
         this.selfIdentifier = identification;
      });
   }

   /** Navigate to chatroom  */
   navigateToRoom(room: ChatRoom) {
      this.navigation.currentRoom = room;
      this.navigation.chatIsActiveWindow = true

      if(!room.hasJoinedRoom) {
         this.chatService.startRoomJoinRequest(room.roomIdentifier, "");
      }
   }
}