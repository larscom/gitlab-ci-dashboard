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

    const isDate =
      DATE_MATCHER.test(String(valueA)) && DATE_MATCHER.test(String(valueB))

    const isNumber = typeof valueA === 'number' && typeof valueB === 'number'
    const isAscending = direction === 'asc'

    if (isDate) {
      return isAscending
        ? Number(new Date(valueA)) - Number(new Date(valueB))
        : Number(new Date(valueB)) - Number(new Date(valueA))
    }

    if (isNumber) {
      return isAscending ? valueA - valueB : valueB - valueA
    }

    return isAscending
      ? String(valueA).localeCompare(valueB)
      : String(valueB).localeCompare(valueA)
  })
}
