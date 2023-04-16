import { DataTableSortStatus } from 'mantine-datatable'

const DATE_MATCHER = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/

export const sortRecords = <T>(
  records: T[],
  propNames: string[],
  direction: DataTableSortStatus['direction']
) => {
  return Array.from(records).sort((a, b) => {
    // eslint-disable-next-line
    let valueA: any = a[propNames[0] as keyof T] ? a[propNames[0] as keyof T] : null
    // eslint-disable-next-line
    let valueB: any = b[propNames[0] as keyof T] ? b[propNames[0] as keyof T] : null

    if (propNames.length === 2) {
      valueA = valueA ? valueA[propNames[1] as keyof T[keyof T]] : valueA
      valueB = valueB ? valueB[propNames[1] as keyof T[keyof T]] : valueB
    }

    if (valueA == null && valueB == null) {
      return 0
    }

    const isAscending = direction === 'asc'

    const isNumber = typeof valueA === 'number' && typeof valueB === 'number'
    if (isNumber) {
      return isAscending ? valueA - valueB : valueB - valueA
    }

    const isDateObject = valueA instanceof Date && valueB instanceof Date
    if (isDateObject) {
      return isAscending
        ? Number(valueA) - Number(valueB)
        : Number(valueB) - Number(valueA)
    }

    const isDateString =
      DATE_MATCHER.test(String(valueA)) && DATE_MATCHER.test(String(valueB))
    if (isDateString) {
      return isAscending
        ? Number(new Date(String(valueA))) - Number(new Date(String(valueB)))
        : Number(new Date(String(valueB))) - Number(new Date(String(valueA)))
    }

    return isAscending
      ? String(valueA).localeCompare(String(valueB))
      : String(valueB).localeCompare(String(valueA))
  })
}
