import { WebsocketService } from './shared/services/websocket-chat.service';
import { environment } from './../environments/environment';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { Subject, Observable, Subscription } from 'rxjs/Rx';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

	ngOnInit() {

	}


}
