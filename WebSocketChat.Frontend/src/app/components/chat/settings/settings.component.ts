import { Router } from '@angular/router';
import { ChatMessage } from './../../../shared/models/chat/messages/chat-message';
import { NavigationService } from './../../../shared/settings/navigation.service';
import { Component, OnInit } from '@angular/core';

@Component({
   selector: 'app-settings',
   templateUrl: './settings.component.html',
   styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

   constructor(
      public appSettings: NavigationService,
      private router: Router) {
      this.previewMessage = new ChatMessage();
      this.previewMessage.senderGuid = "otherUser";
      this.previewMessage.senderName = "Server";
      this.previewMessage.message = "Praise the sun!";
      this.previewMessage.timestamp = new Date();

      this.previewMessageSelf = new ChatMessage();
      this.previewMessageSelf.senderGuid = "preview";
      this.previewMessageSelf.senderName = "You";
      this.previewMessageSelf.message = "Hey!";
      this.previewMessageSelf.timestamp = new Date();
   }

   /** chatmessage used for preview */
   previewMessage: ChatMessage;
   previewMessageSelf: ChatMessage;

   ngOnInit() {

      this.appSettings.chatIsActiveWindow = true;
   }

   /** Change the color theme of the application */
   changeApplicationTheme(themeKey: string):void {
      if(themeKey == "light" || themeKey == "dark") {
         this.appSettings.applicationTheme = themeKey;
      }
   }

   /** Change the design theme of a message */
   changeMessageTheme(event:any):void {
      debugger;
   }

   /** Exist settings and navigate back to the chat room overview*/
   exitSettings(): void {
      //this.router.navigate(['/chatroom', this.appSettings.currentRoom.roomIdentifier]);
      this.appSettings.chatIsActiveWindow = false;
   }
}
