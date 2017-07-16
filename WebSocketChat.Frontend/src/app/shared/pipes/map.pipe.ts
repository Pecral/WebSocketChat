import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
   name: 'mapPipe'
})
/** Transforms a map to a key-value array which can be used *ngFor-statement */
export class MapPipe implements PipeTransform {

   transform(value: Map<any, any>, args?: any): any {
      let mapEntries = [];

      value.forEach((mapValue, key) => {
         mapEntries.push({
            key: key,
            value: mapValue
         });
      });

      return mapEntries;
   }

}