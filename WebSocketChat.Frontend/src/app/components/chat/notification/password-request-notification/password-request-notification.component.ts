import { Component, OnInit, HostBinding, trigger, keyframes, animate, transition, style} from '@angular/core';
import { RoomJoinRequest } from './../../../../shared/models/chat/messages/room-join-request';
import { ChatNotificationComponent } from './../chat-notification.component';

@Component({
   selector: 'password-request-notification',
   templateUrl: './password-request-notification.component.html',
   styleUrls: [
      './password-request-notification.component.scss',
      '../chat-notification.component.scss'
   ],
   animations: [
      trigger('heartbeat', [
         transition('* <=> *', animate(1200, keyframes([
            style({transform: 'scale(1)', transformOrigin: 'center center', animationTimingFunction: 'ease-out', offset: .00}),
            style({transform: 'scale(0.91)', animationTimingFunction: 'ease-in', offset: .20}),
            style({transform: 'scale(0.98)', animationTimingFunction: 'ease-out', offset: .37}),
            style({transform: 'scale(0.87)', animationTimingFunction: 'ease-in', offset: .63}),
            style({transform: 'scale(1)', animationTimingFunction: 'ease-out', offset: .85})
         ])))
      ])
   ]
})
export class PasswordRequestNotificationComponent extends ChatNotificationComponent implements OnInit {

   constructor() { super() }

   toggleHeartbeat: boolean;

   ngOnInit() {
   }

   /** Trigger the heartbeat animation */
   triggerHeartbeat() {
      this.toggleHeartbeat = !this.toggleHeartbeat;
   }
}
