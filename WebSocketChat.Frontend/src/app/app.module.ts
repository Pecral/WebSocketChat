/** Angular Modules  */
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

/** 3rd Party */
import { SplitPaneModule } from 'ng2-split-pane/lib/ng2-split-pane';
import { NgxAutoScroll } from 'ngx-auto-scroll/lib/ngx-auto-scroll.directive';
import { VirtualScrollModule } from 'angular2-virtual-scroll';

/** Components */
import { AppComponent } from './app.component';
import { ChatRoomComponent } from './components/chat/room/chat-room.component';
import { ChatNotificationComponent } from './components/chat/notification/chat-notification.component';
import { PasswordRequestNotificationComponent } from './components/chat/notification/password-request-notification/password-request-notification.component';

import { ChatMessageComponent } from './components/chat/message/chat-message.component';
import { ChatComponent } from './components/chat/chat.component';
import { ChatRoomOverviewComponent } from './components/chat/room-overview/room-overview.component';

/** Services  */
import { ChatService } from './shared/services/websocket-chat.service';

/** Pipes */
import { MapPipe } from './shared/pipes/map.pipe';

@NgModule({
  declarations: [
    /** Components */
    AppComponent,
    ChatComponent,
    ChatMessageComponent,
    ChatRoomComponent,
    ChatNotificationComponent,
    PasswordRequestNotificationComponent,
    ChatRoomOverviewComponent,

    /** Pipes */
    MapPipe,
    
    /** Directives */
    NgxAutoScroll
  ],
  imports: [
    /** Angular */
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,

    /** 3rd party */
    SplitPaneModule,
    VirtualScrollModule
  ],
  providers: [ChatService],
  bootstrap: [AppComponent]
})
export class AppModule { }
