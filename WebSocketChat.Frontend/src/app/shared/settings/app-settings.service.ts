import { ChatRoom } from './../models/chat/chat-room';
import { Injectable } from '@angular/core';

@Injectable()
export class AppSettingsService {

   applicationTheme = "light";
   messageTheme = "irc";
   
   currentRoom: ChatRoom;
   chatIsActiveWindow:boolean = true;   

   constructor() { }

}