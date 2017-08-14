
/** Angular Modules  */
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';

/** 3rd Party */
import { SplitPaneModule } from 'ng2-split-pane/lib/ng2-split-pane';
import { NgxAutoScroll } from 'ngx-auto-scroll/lib/ngx-auto-scroll.directive';
import { VirtualScrollModule } from 'angular2-virtual-scroll';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

const PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true
};

/** PrimeNG */
import { ChipsModule, StepsModule } from 'primeng/primeng';

/** Components */
import { AppComponent } from './app.component';
import { ChatRoomComponent } from './components/chat/room/chat-room.component';
import { ChatNotificationComponent } from './components/chat/notification/chat-notification.component';
import { PasswordRequestNotificationComponent } from './components/chat/notification/password-request-notification/password-request-notification.component';
import { ChatMessageComponent } from './components/chat/message/chat-message.component';
import { ChatComponent } from './components/chat/chat.component';
import { ChatRoomOverviewComponent } from './components/chat/room-overview/room-overview.component';
import { SettingsComponent } from './components/chat/settings/settings.component';
import { ChatRoomCreationComponent } from './components/chat/room-creation/room-creation.component';
import { RoomDefinitionComponent } from './components/chat/room-creation/room-definition/room-definition.component';
import { UserInviteComponent } from './components/chat/room-creation/user-invite/user-invite.component';

/** Services  */
import { ChatService } from './shared/services/websocket-chat.service';
import { NavigationService } from './shared/settings/navigation.service';
import { ChatStorageService } from './shared/settings/chat-storage.service';

/** Pipes */
import { MapPipe } from './shared/pipes/map.pipe';
import { SelfIdentifierFilterPipe } from './components/chat/room-creation/user-invite/self-identifier-filter.pipe';

const appRoutes: Routes = [
  { path: 'chatroom/:id', component: ChatRoomComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'room-creation/:step',component: ChatRoomCreationComponent },
  { path: '', redirectTo: 'chatroom/1', pathMatch: 'full'}
];

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
    ChatRoomCreationComponent,
    UserInviteComponent,
    RoomDefinitionComponent,
    SettingsComponent,

    /** Pipes */
    MapPipe,
    SelfIdentifierFilterPipe,
    
    /** Directives */
    NgxAutoScroll
  ],
  imports: [
    /** Angular */
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    RouterModule.forRoot( appRoutes ),

    /** 3rd party */
    SplitPaneModule,
    VirtualScrollModule,
    PerfectScrollbarModule,

    /** PrimeNG */
    ChipsModule,
    StepsModule
  ],
  providers: [ChatService, NavigationService, ChatStorageService],
  bootstrap: [AppComponent]
})
export class AppModule { }
