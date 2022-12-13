import { Pipe, PipeTransform } from '@angular/core'

@Pipe({ name: 'arrayToString' })
export class ArrayToStringPipe implements PipeTransform {
  transform(input?: any[], seperator = ','): string {
    return input?.length ? input.join(seperator) : '-'
  }
}
