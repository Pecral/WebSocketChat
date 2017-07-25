import { ChatRoom } from './../models/chat/chat-room';
import { Injectable } from '@angular/core';

@Injectable()
export class NavigationService {

   applicationTheme = "light";
   
   currentRoom: ChatRoom;
   chatIsActiveWindow:boolean = true;   

   constructor() { }

}