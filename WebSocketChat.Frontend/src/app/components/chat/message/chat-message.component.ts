import { Component, OnInit, Input } from '@angular/core';
import { ChatMessage } from './../../../shared/models/chat/messages/chat-message';

@Component({
  selector: 'chat-message',
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.css']
})
export class ChatMessageComponent implements OnInit {

  @Input()
  message : ChatMessage;

  @Input()
  /** Our own identifier guid  */
  identifier : string;

  constructor() { }

  ngOnInit() {
  }

}