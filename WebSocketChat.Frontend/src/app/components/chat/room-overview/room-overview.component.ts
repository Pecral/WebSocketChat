import { Router } from '@angular/router';
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';

import { NicknameRequest } from './../../../shared/models/chat/messages/nickname-request';
import { UserLeaveMessage } from './../../../shared/models/chat/messages/user-leave-message';
import { UserJoinMessage } from './../../../shared/models/chat/messages/user-join-message';
import { ChatMessage } from './../../../shared/models/chat/messages/chat-message';
import { ChatUser } from './../../../shared/models/chat/chat-user';
import { ChatRoom } from './../../../shared/models/chat/chat-room';
import * as moment from 'moment';

import { NavigationService } from './../../../shared/settings/navigation.service';

@Component({
   selector: 'room-overview',
   templateUrl: './room-overview.component.html',
   styleUrls: ['./room-overview.component.scss']
})
export class ChatRoomOverviewComponent implements OnInit {

   @Input()
   roomList: Array<ChatRoom> = [];

   @Input()
   userList: Array<ChatUser> = [];

   @Input()
   selfIdentifier: ChatUser;

   constructor(private router: Router, public navigation: NavigationService) { }

   ngOnInit() {
   }

   /** Returns timestamp in a specific format */
   formatDate(timestamp: Date, format: string): string {
      return moment(timestamp).format(format);
   }

   /** Fires the navigateToRoom-event if the requested room is not the same as the current room */
   navigateToRoom(requestedRoom: ChatRoom): void  {
      //if the requested room is already the current room, we will just set the chatroom-pane as the active pane
      //otherwise we will navigate to the chatroom
      if(this.navigation.currentRoom.roomIdentifier == requestedRoom.roomIdentifier) {
         this.navigation.chatIsActiveWindow = true;
      }
      else {
         this.router.navigate(['/chatroom', requestedRoom.roomIdentifier]);
      }
   }

   /** Navigate to settings */
   navigateToSettings(): void {
      this.router.navigate(['/settings']);
   }

   /** Get the room's last message depending on its type */
   getRoomsLastMessage(room: ChatRoom): string {
      let message = room.messages[room.messages.length -1];
      if(message instanceof ChatMessage) {
         if(room.isPrivateRoom) {
            return message.message;
         }
         else {
            return message.senderName + ": " + message.message;
         }
      }
      else if(message instanceof UserJoinMessage)  {
         return message.senderName + " has joined the " + (message.roomIdentifier != 0 ? "room" : "server") + ".";
      }
      else if(message instanceof UserLeaveMessage) {
         return message.senderName + " has left the " + (message.roomIdentifier != 0 ? "room" : "server") + ".";
      }
      else if(message instanceof NicknameRequest) {
         return message.oldNickname + " is now named " + message.requestedNickname;
      }
   }

}
