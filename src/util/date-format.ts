const LANGUAGES = [...(navigator?.languages || ['en-US'])]

export const formatDateTime = (dateTime: string) => {
  const { timeZone } = Intl.DateTimeFormat().resolvedOptions()
  return new Intl.DateTimeFormat(LANGUAGES, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone
  }).format(new Date(dateTime))
}
