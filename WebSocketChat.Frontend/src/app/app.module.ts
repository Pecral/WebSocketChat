import { ChatRoomComponent } from './components/chat/room/chat-room.component';
import { TestService } from './shared/services/test.service';
import { ChatNotificationComponent } from './components/chat/notification/chat-notification.component';
import { WebsocketService } from './shared/services/websocket-chat.service';
import { ChatMessageComponent } from './components/chat/message/chat-message.component';
import { ChatComponent } from './components/chat/chat.component';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SplitPaneModule } from 'ng2-split-pane/lib/ng2-split-pane';

import { AppComponent } from './app.component';

import { AccordionModule, PanelModule } from 'primeng/primeng';

@NgModule({
  declarations: [
    AppComponent,
    ChatComponent,
    ChatMessageComponent,
    ChatRoomComponent,
    ChatNotificationComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,

    AccordionModule,
    PanelModule,
    SplitPaneModule
  ],
  providers: [WebsocketService, TestService],
  bootstrap: [AppComponent]
})
export class AppModule { }
