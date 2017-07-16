/** Angular */
import { Component, OnInit, QueryList, ViewChildren, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
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
   styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
   //proxy methods to acess service properties
   userDictionary: Map<string, ChatUser>;
   roomDictionary: Map<number, ChatRoom>;
   selfIdentifier: ChatUser = new ChatUser();

   constructor(private chatService: ChatService) {

   }

   ngOnInit() {
      this.userDictionary = this.chatService.userDictionary;
      this.roomDictionary = this.chatService.roomDictionary;
      this.chatService.selfIdentifierChanged.subscribe((identification : ChatUser) => {
         this.selfIdentifier = identification;
      });
   }

   /** Scroll to the last chat message  */
   scrollToBottom(): void {
      // $('.chat-messages').animate({
      // 	scrollTop:$('.chat li:last').offset().top
      // }, 300);

      // try {
      // 	this.chatWrapper.nativeElement.scrollTop = this.chatWrapper.nativeElement.scrollHeight;
      // } catch (err) { }
   }

   /** Proxy method to pass messages to the webservice */
   sendMessage(message: ChatMessage | NicknameRequest):void {
      if(message instanceof ChatMessage || this.isNicknameAvailable(message.requestedNickname)) {
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
}