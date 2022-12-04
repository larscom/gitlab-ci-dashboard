import { Pipe, PipeTransform } from '@angular/core'

const format: Intl.DateTimeFormatOptions = {
  month: '2-digit',
  day: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}

@Pipe({ name: 'formatTime' })
export class FormatTimePipe implements PipeTransform {
  transform(dateTime?: string): string | undefined {
    const languages = [...(navigator?.languages || ['en-US'])]
    return dateTime
      ? new Intl.DateTimeFormat(languages, format).format(new Date(dateTime))
      : dateTime
  }
}
