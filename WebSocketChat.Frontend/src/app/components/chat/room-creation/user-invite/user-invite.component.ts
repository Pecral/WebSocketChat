import { ChatStorageService } from './../../../../shared/settings/chat-storage.service';
import { ChatRoom } from './../../../../shared/models/chat/chat-room';
import { ChatUser } from './../../../../shared/models/chat/chat-user';
import { Component, OnInit, Input } from '@angular/core';

@Component({
   selector: 'user-invite',
   templateUrl: './user-invite.component.html',
   styleUrls: ['./user-invite.component.scss']
})
export class UserInviteComponent implements OnInit {

   usersToInvite: Array<ChatUser> = [];

   @Input()
   roomToCreate: ChatRoom;

   constructor(public chatStorage: ChatStorageService) { }

   ngOnInit() {
   }


   /** Add user to the list of users that will be invited to the new room */
   toggleUserInvite(chatUser: ChatUser): void {
      if (!this.usersToInvite.some(x => x.identifier == chatUser.identifier)) {
         this.usersToInvite.push(chatUser);
         this.roomToCreate.connectedUsers.push(chatUser.identifier);
      }
      else {
         let userIndex = this.usersToInvite.indexOf(chatUser);
         this.usersToInvite.splice(userIndex, 1);

         let roomUserIndex = this.roomToCreate.connectedUsers.indexOf(chatUser.identifier);
         this.roomToCreate.connectedUsers.splice(roomUserIndex, 1);
      }
   }
}
