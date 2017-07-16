/** Angular */
import { Component, OnInit, Input } from '@angular/core';

/** Models */
import { NicknameRequest } from './../../../shared/models/chat/messages/nickname-request';
import { MessageType } from './../../../shared/models/chat/message-type';
import { UserLeaveMessage } from './../../../shared/models/chat/messages/user-leave-message';
import { UserJoinMessage } from './../../../shared/models/chat/messages/user-join-message';
import { Message } from "./../../../shared/models/chat/message";

@Component({
  selector: 'chat-notification',
  templateUrl: './chat-notification.component.html',
  styleUrls: ['./chat-notification.component.css']
})
export class ChatNotificationComponent implements OnInit {

  @Input()
  notificationMessage : UserJoinMessage | UserLeaveMessage | NicknameRequest;

  constructor() { }

  ngOnInit() {
  }

  /** Returns the nickname of the user who caused this message  */
  getNickname(): string {
    if(this.notificationMessage instanceof NicknameRequest) {
      return this.notificationMessage.oldNickname; 
    }
    else {
      return this.notificationMessage.senderName;
    }
  }

  /** Returns the notification message based on the type of the notification  */
  getMessage(): string {
    if(this.notificationMessage instanceof UserJoinMessage) {
      return "has joined the server."
    }
    else if(this.notificationMessage instanceof (UserLeaveMessage)) {
      if(this.notificationMessage.roomIdentifier != 0) {
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
}