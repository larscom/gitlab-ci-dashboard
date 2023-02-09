const FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
}
const LANGUAGES = [...(navigator?.languages || ['en-US'])]

export const formatDateTime = (dateTime: string) =>
  new Intl.DateTimeFormat(LANGUAGES, FORMAT).format(new Date(dateTime))
