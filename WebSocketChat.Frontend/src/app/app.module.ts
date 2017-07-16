/** Angular Modules  */
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

/** 3rd Party */
import { SplitPaneModule } from 'ng2-split-pane/lib/ng2-split-pane';
import { AccordionModule, PanelModule } from 'primeng/primeng';

/** Components */
import { AppComponent } from './app.component';
import { ChatRoomComponent } from './components/chat/room/chat-room.component';
import { ChatNotificationComponent } from './components/chat/notification/chat-notification.component';
import { ChatMessageComponent } from './components/chat/message/chat-message.component';
import { ChatComponent } from './components/chat/chat.component';

/** Services  */
import { ChatService } from './shared/services/websocket-chat.service';

/** Pipes */
import { MapPipe } from './shared/pipes/map.pipe';

@NgModule({
  declarations: [
    AppComponent,
    ChatComponent,
    ChatMessageComponent,
    ChatRoomComponent,
    ChatNotificationComponent,

    MapPipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,

    AccordionModule,
    PanelModule,
    SplitPaneModule
  ],
  providers: [ChatService],
  bootstrap: [AppComponent]
})
export class AppModule { }
