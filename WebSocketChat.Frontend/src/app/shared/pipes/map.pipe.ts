import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
   name: 'mapPipe'
})
/** Transforms a map to a key-value array which can be used *ngFor-statement */
export class MapPipe implements PipeTransform {
   mapEntries = [];

   transform(value: Map<any, any>, args?: any): any {
      this.mapEntries.length = 0;

      value.forEach((mapValue, key) => {
         this.mapEntries.push({
            key: key,
            value: mapValue
         });
      });

      return this.mapEntries;
   }

}