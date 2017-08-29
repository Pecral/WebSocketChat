import { MessageType } from 'app/shared/models/chat/message-type';
import { ChatMessage } from './../../../../shared/models/chat/messages/chat-message';
import { UserJoinMessage } from './../../../../shared/models/chat/messages/user-join-message';
import { UserLeaveMessage } from './../../../../shared/models/chat/messages/user-leave-message';
import { NicknameRequest } from './../../../../shared/models/chat/messages/nickname-request';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'irc-message',
  templateUrl: './irc-message.component.html',
  styleUrls: ['./irc-message.component.scss']
})
export class IrcMessageComponent implements OnInit {

  @Input()
  message: ChatMessage | UserJoinMessage | UserLeaveMessage | NicknameRequest;

  /** An IRC message component displays user messages as well as server messages in a simple style */
  constructor() { }

  /** proxy so that we can access the enum in our html-file */
  messageType: any = MessageType;

  /** Resolve the message's content (the code could probably be reused - parts of it also exists in the chat-notification-component) */
  resolveMessageContent(): string {
    var content = "";

    if(this.message instanceof ChatMessage) {
      return this.message.message;
    }
    else if(this.message instanceof UserJoinMessage) {
      content = "has joined the " + (this.message.roomIdentifier != 0 ? "room" : "server") + ".";         
    }
    else if(this.message instanceof UserLeaveMessage) {
      content = "has left the " + (this.message.roomIdentifier != 0 ? "room" : "server") + ".";   
    }
    else if(this.message instanceof NicknameRequest) {
      content = `is now named ${this.message.requestedNickname}.`;
    }

    return this.message.senderName + " " + content;
  }

  ngOnInit() {
  }

}
