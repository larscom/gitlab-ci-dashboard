import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
  name: 'maxLength',
  standalone: true
})
export class MaxLengthPipe implements PipeTransform {
  transform(value: string, maxLength: number = 25): string {
    const suffix = value.length > maxLength ? '...' : ''
    return `${value.slice(0, maxLength)}${suffix}`
  }
}
