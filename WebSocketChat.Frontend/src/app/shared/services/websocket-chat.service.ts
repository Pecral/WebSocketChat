import { RoomRemovalMessage } from './../models/chat/messages/room-removal-message';
import { Router } from '@angular/router';
import { ChatStorageService } from './../settings/chat-storage.service';
import { ImageBase64Encoder } from './../helper/ImageBase64Encoder';
import { RoomCreationRequest } from './../models/chat/messages/room-creation-request';
import { RoomJoinRequest } from './../models/chat/messages/room-join-request';
import { environment } from './../../../environments/environment.prod';
import { Injectable, EventEmitter } from '@angular/core';
import { Subject, Observer, Observable } from "rxjs";

/** Models */
import { Message } from './../../shared/models/chat/message';
import { ChatMessage } from './../../shared/models/chat/messages/chat-message';
import { ChatRoom } from './../models/chat/chat-room';
import { ChatUser } from './../models/chat/chat-user';
import { NicknameRequest } from './../../shared/models/chat/messages/nickname-request';
import { UserLeaveMessage } from './../../shared/models/chat/messages/user-leave-message';
import { CustomJsonDeserializer } from './../../shared/helper/CustomJsonDeserializer';
import { ServerInformationMessage } from './../../shared/models/chat/messages/server-information-message';
import { UserJoinMessage } from './../../shared/models/chat/messages/user-join-message';
import { MessageType } from './../../shared/models/chat/message-type';

@Injectable()
export class ChatService {

   private webSocket: Subject<any>;
   userDictionary: Map<string, ChatUser> = new Map<string, ChatUser>();
   roomDictionary: Map<number, ChatRoom> = new Map<number, ChatRoom>();
   roomList: Array<ChatRoom> = [];
   userList: Array<ChatUser> = [];

   //save global room in additional variable for easier access
   globalRoom: ChatRoom;
   selfIdentifier: ChatUser;

   selfIdentifierChanged: EventEmitter<ChatUser> = new EventEmitter<ChatUser>();

   constructor(private chatStorage: ChatStorageService, private router: Router) {
      //save instances of user dictionary and room list in chat storage
      this.chatStorage.roomList = this.roomList;
      this.chatStorage.userList = this.userList;

      //create dummy global room
      this.globalRoom = new ChatRoom();
      this.globalRoom.roomIdentifier = 0;
      this.roomDictionary.set(0, this.globalRoom);
      this.roomList.push(this.globalRoom);

      this.webSocket = this.createWebsocket();

      this.webSocket.subscribe(message => {
         if (message instanceof MessageEvent) {
            this.handleMessage(CustomJsonDeserializer.deserialize(message.data));
         }
      });
   }

   public createWebsocket(): Subject<MessageEvent> {
      console.log("create websocket");
      let socket = new WebSocket(environment.websocketBaseUrl);
      let observable = Observable.create(
         (observer: Observer<MessageEvent>) => {
            socket.onmessage = observer.next.bind(observer);
            socket.onerror = observer.error.bind(observer);
            socket.onclose = observer.complete.bind(observer);
            return socket.close.bind(socket);
         }
      );
      let observer = {
         next: (data: Object) => {
            if (socket.readyState === WebSocket.OPEN) {
               socket.send(JSON.stringify(data));
            }
         }
      };
      return Subject.create(observer, observable);
   }

   /** Pass message into the websocket */
   sendMessage(message: ChatMessage | NicknameRequest | RoomCreationRequest): void {
      this.webSocket.next(message);
   }

   /** Handles a message which was received through the websocket */
   private handleMessage(messageData: any): void {
      let messageModel = messageData as Message;
      this.resolveMessageIdentifier(messageModel);

      if (messageModel.messageType != undefined) {
         switch (messageModel.messageType) {
            case MessageType.ChatMessage:
               let chatMessage = Object.assign(new ChatMessage(), messageModel);
               this.addMessageToRoom(chatMessage.roomIdentifier, chatMessage);
               break;

            case MessageType.UserJoinMessage:
               let joinMessage = Object.assign(new UserJoinMessage(), messageModel);
               this.handleJoiningUser(joinMessage);
               break;

            case MessageType.UserLeaveMessage:
               let leaveRoomMessage = Object.assign(new UserLeaveMessage(), messageModel);
               this.handleLeavingUser(leaveRoomMessage);
               break;

            case MessageType.ServerInformation:
               let serverInformation = Object.assign(new ServerInformationMessage(), messageModel);
               this.handleServerInformation(serverInformation);
               break;

            case MessageType.NicknameRequest:
               let nicknameRequest = Object.assign(new NicknameRequest(), messageModel);
               this.handleNicknameChange(nicknameRequest);
               break;

            case MessageType.RoomJoinRequest:
               let joinRequest = Object.assign(new RoomJoinRequest(), messageModel);
               this.handleRoomJoinRequest(joinRequest);
               break;
               
            case MessageType.RoomCreationRequest:
               let newRoom = Object.assign(new RoomCreationRequest(), messageModel);
               this.handleNewRoom(newRoom);
               break;

            case MessageType.RoomRemovalMessage:
               let removalMessage = Object.assign(new RoomRemovalMessage(), messageModel);
               if(this.roomDictionary.has(removalMessage.roomIdentifier)) {
                  let removedRoom = this.roomDictionary.get(removalMessage.roomIdentifier);
                  this.roomDictionary.delete(removalMessage.roomIdentifier);
                  let removedRoomIndex = this.roomList.indexOf(removedRoom);
                  this.roomList = this.roomList.slice(removedRoomIndex, 1);
               }
               break;
         }
      }
   }

   /** Handles a new room which has been created */
   private handleNewRoom(roomInformation: RoomCreationRequest):void {
      let room = Object.assign(new ChatRoom(), roomInformation.requestedRoom);
      room.hasJoinedRoom = room.connectedUsers.some(x => x == this.selfIdentifier.identifier);
      this.roomDictionary.set(room.roomIdentifier, room);
      this.roomList.push(room);
      this.roomList = this.roomList.slice();
      this.updateNicknameStringAggregation(room.roomIdentifier);

      //if we were the one that created this room, we will navigate to it
      if(roomInformation.senderGuid == this.selfIdentifier.identifier) {
         this.router.navigate(["/chatroom", room.roomIdentifier]);
      }
   }

   /** Handle the message which informs us about the currently connected users as well as available rooms */
   private handleServerInformation(serverInformation: ServerInformationMessage): void {
      for (let userKey in serverInformation.userDictionary) {
         this.userDictionary.set(userKey, serverInformation.userDictionary[userKey]);
         if(!this.userList.some(x => x.identifier == userKey)) {
            this.userList.push(serverInformation.userDictionary[userKey]);
         }
      }

      this.userList = this.userList.slice();

      for (let roomKey in serverInformation.availableRooms) {
         //temporary parseint because the typescript compiler marked roomKey as an string even though "availableRooms" has a number as a key
         let roomIdentifier = parseInt(roomKey);
         let room = Object.assign(new ChatRoom(), serverInformation.availableRooms[roomIdentifier]);

         //global room is a special case because we could have a dummy of it
         if (roomIdentifier == 0) {
            this.globalRoom.connectedUsers = room.connectedUsers;
            this.globalRoom.description = room.description;
            this.globalRoom.roomAvatarBase64 = room.roomAvatarBase64;
            this.globalRoom.name = room.name;
         }
         else {
            this.roomDictionary.set(roomIdentifier, room);
            this.roomList.push(room);
         }

         //if the room is password protected, we will push a password-request message to the room so that the user can see it
         if(room.isPasswordProtected) {
            this.addMessageToRoom(roomIdentifier, new RoomJoinRequest(false));
         }

         this.updateNicknameStringAggregation(room.roomIdentifier);
      }
   }

   /** Handle our room join request which was probably refused by the server */
   private handleRoomJoinRequest(joinRequest: RoomJoinRequest) {
      if (!joinRequest.isSuccessful) {
         if (this.roomDictionary.has(joinRequest.roomIdentifier)) {
            let messageRoom = this.roomDictionary.get(joinRequest.roomIdentifier);
            messageRoom.failedJoinRequest.next();
         }
      }
      else {
         //clear room-messages if the request was succesful (password-request notifications should be deleted)
         if(this.roomDictionary.has(joinRequest.roomIdentifier)) {
            this.roomDictionary.get(joinRequest.roomIdentifier).messages = [];
         }
      }
   }

   /** Handle message which informs us about a joining user */
   private handleJoiningUser(joinMessage: UserJoinMessage): void {
      //if the user joined the global room, it means that he has joined the server itself
      if (joinMessage.roomIdentifier == this.globalRoom.roomIdentifier) {
         //if we are the user who joined, we will save the guid and the nickname
         if (joinMessage.isOriginOfMessage) {
            this.selfIdentifier = joinMessage.chatUser;
            this.selfIdentifierChanged.next(joinMessage.chatUser);
            this.chatStorage.selfIdentifier = this.selfIdentifier;
         }

         //add user to dictionary if it's a new user
         this.userDictionary.set(joinMessage.chatUser.identifier, joinMessage.chatUser);
         this.userList.push(joinMessage.chatUser);
         // if a user joins/leave the server, we will create a new instance of userList in the shared chat-storage to trigger the change detection.
         // of course, this can be done a lot better with ChangeDetectorRef, but it's fine for now.
         this.userList = this.userList.slice();
         this.chatStorage.userList = this.userList;
      }

      let targetRoom = this.roomDictionary.get(joinMessage.roomIdentifier);

      if (joinMessage.isOriginOfMessage) {
         targetRoom.hasJoinedRoom = true;
      }

      //add user to room
      targetRoom.connectedUsers.push(joinMessage.senderGuid);

      //since this could be a new user and his guid wasn't saved in the user-dictionary, the previous resolve didn't work and we have to resolve it now
      this.resolveMessageIdentifier(joinMessage);
      this.addMessageToRoom(joinMessage.roomIdentifier, joinMessage);
      this.updateNicknameStringAggregation(joinMessage.roomIdentifier);
   }

   /** Handle message which informs us that a specific user has left */
   private handleLeavingUser(message: UserLeaveMessage): void {
      let removeUserFromRoom = (room: ChatRoom) => {
         //remove user from room
         let userIndex = room.connectedUsers.indexOf(message.senderGuid);
         room.connectedUsers.splice(userIndex, 1);

         this.addMessageToRoom(room.roomIdentifier, message);
         this.updateNicknameStringAggregation(room.roomIdentifier);
      }

      //if the user has left the server, remove the user from all rooms
      if (message.roomIdentifier == this.globalRoom.roomIdentifier) {
         this.roomDictionary.forEach((value: ChatRoom, key: number) => {
            if(value.hasJoinedRoom && value.connectedUsers.indexOf(message.senderGuid) != -1) {
               removeUserFromRoom(value);
            }
         });

         //remove from user dictionary
         this.userDictionary.delete(message.senderGuid);
         // if a user joins/leave the server, we will create a new instance of userList in the shared chat-storage to trigger the change detection.
         // of course, this can be done a lot better with ChangeDetectorRef, but it's fine for now.
         this.userList = this.userList.filter(x => x.identifier != message.senderGuid).slice();
         this.chatStorage.userList = this.userList;
      }
      else {
         //remove user from room
         let room = this.roomDictionary.get(message.roomIdentifier);
         removeUserFromRoom(room);
      }
   }

   /** If a user has changed his nickname, we have to update our user dictionary */
   private handleNicknameChange(message: NicknameRequest): void {
      if (message.wasSuccessful) {
         message.oldNickname = this.userDictionary.get(message.senderGuid).nickname;

         if (message.senderGuid == this.selfIdentifier.identifier) {
            this.selfIdentifier.nickname = message.requestedNickname;
         }

         this.userDictionary.get(message.senderGuid).nickname = message.requestedNickname;

         //iterate through all rooms and add a notification message if the user exists in the room
         this.roomDictionary.forEach((room: ChatRoom, key: number) => {
            if (room.connectedUsers.includes(message.senderGuid)) {
               this.addMessageToRoom(key, message);
               this.updateNicknameStringAggregation(key);
            }
         });
      }
   }

   /** Try to push the message into a specific room (if it's available) */
   private addMessageToRoom(roomIdentifier: number, message: any) {
      if (this.roomDictionary.has(roomIdentifier)) {
         let messageRoom = this.roomDictionary.get(roomIdentifier);
         messageRoom.messages = messageRoom.messages.concat(message); //create new array to force change detection
         messageRoom.lastMessageTimestamp = message.timestamp;
      }
   }

   /** Resolve the guid of the message's sender and save his name in the identifier model */
   private resolveMessageIdentifier(identifierModel: any): void {
      if (identifierModel.senderGuid && this.userDictionary.has(identifierModel.senderGuid)) {
         identifierModel.senderName = this.userDictionary.get(identifierModel.senderGuid).nickname;
      }
   }

   /** Updates the aggregation-string of all nicknames which are currently connected to the room/server */
   private updateNicknameStringAggregation(room: number): void {
      if (this.roomDictionary.has(room)) {
         let roomInstance = this.roomDictionary.get(room);

         roomInstance.nicknameStringAggregation = "";
         for (let userGuid of roomInstance.connectedUsers) {
            if (userGuid != this.selfIdentifier.identifier) {
               roomInstance.nicknameStringAggregation += ", " + this.userDictionary.get(userGuid).nickname;
            }
         }
      }
   }

   /** Send the server a room join request */
   public startRoomJoinRequest(roomIdentifier: number, password: string): void {
      let request = new RoomJoinRequest();
      request.roomIdentifier = roomIdentifier;
      request.password = password;
      this.webSocket.next(request);
   }
}