import { ChatStorageService } from './../../../../shared/settings/chat-storage.service';
import { ChatUser } from './../../../../shared/models/chat/chat-user';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'selfIdentifierFilter'
})
export class SelfIdentifierFilterPipe implements PipeTransform {
  constructor(public chatStorage: ChatStorageService) { }

  transform(items: ChatUser[], args?: any): any {
    return items.filter(x => x.identifier != this.chatStorage.selfIdentifier.identifier);
  }

}