import { ChatRoom } from './../models/chat/chat-room';
import { ChatUser } from './../models/chat/chat-user';
import { Injectable } from '@angular/core';

@Injectable()
export class ChatStorageService {
   /** user-instance of ourself */
   selfIdentifier: ChatUser;

   /** dictionary of all connected users */
   userDictionary: Map<string, ChatUser>;

   /** list of all available chat rooms */
   roomList : Array<ChatRoom> = [];
   
   constructor() { }

}