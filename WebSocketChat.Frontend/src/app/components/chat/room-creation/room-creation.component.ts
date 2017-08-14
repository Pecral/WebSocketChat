import { ChatService } from './../../../shared/services/websocket-chat.service';
import { ChatRoom } from './../../../shared/models/chat/chat-room';
import { RoomCreationRequest } from './../../../shared/models/chat/messages/room-creation-request';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatUser } from './../../../shared/models/chat/chat-user';
import { NavigationService } from './../../../shared/settings/navigation.service';
import { ChatStorageService } from './../../../shared/settings/chat-storage.service';
import { Component, OnInit } from '@angular/core';
import { MenuItem } from "primeng/primeng";

@Component({
   selector: 'chatroom-creation',
   templateUrl: './room-creation.component.html',
   styleUrls: ['./room-creation.component.scss']
})
export class ChatRoomCreationComponent implements OnInit {

   constructor(
      public chatStorage: ChatStorageService,
      private navigation: NavigationService,
      private route: ActivatedRoute,
      private router: Router,
      private chatService: ChatService) { }

   //creation step
   items: MenuItem[];
   roomToCreate: ChatRoom = new ChatRoom();
   creationStep: RoomCreationStep;
   activeIndex: number;

   ngOnInit() {
      this.items = [
         {label: 'User Invitation'},
         {label: 'Room Definition'}
      ];

      this.route.params.subscribe(params => {
         let creationStep = params['step'] as string;
         if(creationStep.toLowerCase() == "user-invitation") {
            this.creationStep = RoomCreationStep.UserInvitation;
            this.activeIndex = 0;
         }
         else {
            this.creationStep = RoomCreationStep.RoomDefinition;
            this.activeIndex = 1;
         }
      });
   }

   exitRoomCreation(): void {
      this.navigation.chatIsActiveWindow = false;
   }


   changeCreationStep():void {
      switch(this.activeIndex) {
         case 0:
            if(this.creationStep != RoomCreationStep.UserInvitation) {
               this.router.navigate(['/room-creation', 'user-invitation']);
            }
         break;
         case 1:
            if(this.creationStep != RoomCreationStep.RoomDefinition) {
               this.router.navigate(['/room-creation', 'room-definition']);
            }         
         break;         
      }
   }
}

enum RoomCreationStep {
   UserInvitation,
   RoomDefinition
}