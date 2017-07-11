import { ChatMessage } from './../../../shared/models/chat/messages/chat-message';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'chat-message',
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.css']
})
export class ChatMessageComponent implements OnInit {

  @Input()
  message : ChatMessage;

  @Input()
  /** Identifier guid of yourself */
  identifier : string;

  constructor() { }

  ngOnInit() {
  }

}