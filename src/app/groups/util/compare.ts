const dateMatcher = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/

export function compareNumber(a: number = 0, b: number = 0): number {
  return a - b
}

export function compareString(a: string = '', b: string = ''): number {
  return a.localeCompare(b)
}

export function compareStringDate(a: string = '', b: string = ''): number {
  const isDateString = dateMatcher.test(a) && dateMatcher.test(b)
  return isDateString ? Number(new Date(a)) - Number(new Date(b)) : 0
}
