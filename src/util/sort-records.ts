import { DataTableSortStatus } from 'mantine-datatable'

const DATE_MATCHER = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/

export const sortRecords = <T>(
  records: T[],
  propNames: string[],
  direction: DataTableSortStatus['direction']
) => {
  return Array.from(records).sort((a, b) => {
    const valueA = a[propNames[0]] ? a[propNames[0]][propNames[1]] : null
    const valueB = b[propNames[0]] ? b[propNames[0]][propNames[1]] : null

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
        ? Number(new Date(valueA)) - Number(new Date(valueB))
        : Number(new Date(valueB)) - Number(new Date(valueA))
    }

    return isAscending
      ? String(valueA).localeCompare(valueB)
      : String(valueB).localeCompare(valueA)
  })
}
