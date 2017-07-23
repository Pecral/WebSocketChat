import { Component, OnInit, Input } from '@angular/core';
import { ChatMessage } from './../../../shared/models/chat/messages/chat-message';

import * as moment from 'moment';

@Component({
   selector: 'chat-message',
   templateUrl: './chat-message.component.html',
   styleUrls: ['./chat-message.component.scss']
})
export class ChatMessageComponent implements OnInit {

   @Input()
   message: ChatMessage;

   @Input()
   /** Our own identifier guid  */
   identifier: string;

   constructor() { }

   ngOnInit() {
   }

   /** Returns timestamp in a specific format */
   formatDate(timestamp: Date, format: string): string {
      return moment(timestamp).format(format);
   }

}