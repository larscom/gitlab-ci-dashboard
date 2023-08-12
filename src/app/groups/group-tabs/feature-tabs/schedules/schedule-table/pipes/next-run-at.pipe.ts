import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
  name: 'nextRunAt',
  standalone: true
})
export class NextRunAtPipe implements PipeTransform {
  transform(dateTime: string): string {
    const now = Date.now()
    const next = new Date(dateTime).getTime()
    const diffHours = Math.round((next - now) / 3600000)

    return diffHours > 0 ? `in ${diffHours} hours` : '< 1 hour'
  }
}
