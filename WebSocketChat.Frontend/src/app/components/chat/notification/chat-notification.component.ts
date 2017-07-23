import { RoomJoinRequest } from './../../../shared/models/chat/messages/room-join-request';
/** Angular */
import { Component, OnInit, Input } from '@angular/core';

/** Models */
import { NicknameRequest } from './../../../shared/models/chat/messages/nickname-request';
import { MessageType } from './../../../shared/models/chat/message-type';
import { UserLeaveMessage } from './../../../shared/models/chat/messages/user-leave-message';
import { UserJoinMessage } from './../../../shared/models/chat/messages/user-join-message';
import { Message } from "./../../../shared/models/chat/message";

import * as moment from 'moment';

@Component({
   selector: 'chat-notification',
   templateUrl: './chat-notification.component.html',
   styleUrls: ['./chat-notification.component.scss']
})
export class ChatNotificationComponent implements OnInit {

   /** proxy so that we can access the enum in our html-file */
   messageType: any = MessageType;

   @Input()
   notificationMessage: UserJoinMessage | UserLeaveMessage | NicknameRequest | RoomJoinRequest;

   constructor() { }

   ngOnInit() {
   }

   /** Get the message's string */
   getMessage():string {
      return this.getNickname() + " " + this.getMessageContent();
   }

   /** Returns the nickname of the user who caused this message  */
   getNickname(): string {
      if (this.notificationMessage instanceof NicknameRequest) {
         return this.notificationMessage.oldNickname;
      }
      else {
         return this.notificationMessage.senderName;
      }
   }

   /** Returns the notification message based on the type of the notification  */
   getMessageContent(): string {
      if (this.notificationMessage instanceof UserJoinMessage) {
         return "has joined the server."
      }
      else if (this.notificationMessage instanceof (UserLeaveMessage)) {
         if (this.notificationMessage.roomIdentifier != 0) {
            return "has left the room."
         }
         else {
            return "has left the server."
         }
      }
      else {
         return `is now named ${this.notificationMessage.requestedNickname}.`;
      }
   }

   /** Returns timestamp in a specific format */
   formatDate(timestamp: Date, format: string): string {
      return moment(timestamp).format(format);
   }
}