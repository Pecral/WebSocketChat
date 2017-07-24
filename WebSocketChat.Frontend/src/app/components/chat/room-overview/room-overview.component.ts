import { NicknameRequest } from './../../../shared/models/chat/messages/nickname-request';
import { UserLeaveMessage } from './../../../shared/models/chat/messages/user-leave-message';
import { UserJoinMessage } from './../../../shared/models/chat/messages/user-join-message';
import { ChatMessage } from './../../../shared/models/chat/messages/chat-message';
import { ChatUser } from './../../../shared/models/chat/chat-user';
import { ChatRoom } from './../../../shared/models/chat/chat-room';
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';

import * as moment from 'moment';

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
   currentRoom: ChatRoom;

   @Input()
   selfIdentifier: ChatUser;

   @Output()
   navigateToRoom: EventEmitter<ChatRoom> = new EventEmitter<ChatRoom>();

   constructor() { }

   ngOnInit() {
   }

   /** Returns timestamp in a specific format */
   formatDate(timestamp: Date, format: string): string {
      return moment(timestamp).format(format);
   }

   /** Fires the navigateToRoom-event if the requested room is not the same as the current room */
   requestNavigateToRoom(requestedRoom: ChatRoom): void  {
      this.navigateToRoom.next(requestedRoom);
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
