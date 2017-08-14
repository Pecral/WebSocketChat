import { ChatStorageService } from './../../../../shared/settings/chat-storage.service';
import { ChatService } from './../../../../shared/services/websocket-chat.service';
import { RoomCreationRequest } from './../../../../shared/models/chat/messages/room-creation-request';
import { ChatRoom } from './../../../../shared/models/chat/chat-room';
import { Component, OnInit, Input } from '@angular/core';

@Component({
   selector: 'room-definition',
   templateUrl: './room-definition.component.html',
   styleUrls: ['./room-definition.component.scss']
})
export class RoomDefinitionComponent implements OnInit {

   @Input()
   roomToCreate: ChatRoom;

   showInvalidRoomNameError: boolean;

   constructor(private chatService: ChatService, private chatStorage: ChatStorageService) { }

   ngOnInit() {
   }

   /** Create the chat room */
   createRoom() {
      if (this.isRoomNameValid()) {
         let roomRequest = new RoomCreationRequest();
         roomRequest.requestedRoom = this.roomToCreate;

         this.chatService.sendMessage(roomRequest);
      }
      else {
         this.showInvalidRoomNameError = true;
      }
   }

   /** Returns whether the current room name is valid */
   isRoomNameValid() {
      let roomName = this.roomToCreate.name;
      if (!roomName || roomName.trim() == "") {
         return false;
      }

      roomName = roomName.trim().toLowerCase();

      if (!this.chatStorage.roomList.some(x => x.name.toLowerCase() == roomName)) {
         return true;
      }
   }

   /** Set the room's avatar if the user has uploaded an image */
   onRoomAvatarUpload(event: any): void {
      if (event.target.files && event.target.files.length > 0) {
         var reader = new FileReader();
         reader.onload = (uploadEvent) => {
            this.roomToCreate.roomAvatarBase64 = reader.result;
         }
         reader.readAsDataURL(event.target.files[0]);
      }
   }
}
