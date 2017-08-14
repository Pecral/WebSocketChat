import { ChatRoom } from './../models/chat/chat-room';
import { ChatUser } from './../models/chat/chat-user';
import { Injectable } from '@angular/core';

@Injectable()
export class ChatStorageService {
   /** user-instance of ourself */
   selfIdentifier: ChatUser;

   /** list all connected users */
   userList: Array<ChatUser>;

   /** list of all available chat rooms */
   roomList : Array<ChatRoom> = [];
   
   constructor() { }

}