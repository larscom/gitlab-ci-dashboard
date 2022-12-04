import { Pipe, PipeTransform } from '@angular/core'

const format: Intl.DateTimeFormatOptions = {
  month: 'numeric',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
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
