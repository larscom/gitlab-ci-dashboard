import { DataTableSortStatus } from 'mantine-datatable'

const DATE_MATCHER = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/

export const sortRecords = <T>(
  records: T[],
  propNames: string[],
  direction: DataTableSortStatus['direction']
) => {
  return Array.from(records).sort((a, b) => {
    const propA = a[propNames[0]] ? a[propNames[0]][propNames[1]] : null
    const propB = b[propNames[0]] ? b[propNames[0]][propNames[1]] : null

    if (propA == null && propB == null) {
      return 0
    }

    const isDate =
      DATE_MATCHER.test(String(propA)) && DATE_MATCHER.test(String(propB))

    const isNumber = typeof propA === 'number' && typeof propB === 'number'
    const isAscending = direction === 'asc'

    if (isDate) {
      return isAscending
        ? Number(new Date(propA)) - Number(new Date(propB))
        : Number(new Date(propB)) - Number(new Date(propA))
    }

    if (isNumber) {
      return isAscending ? propA - propB : propB - propA
    }

    return isAscending
      ? String(propA).localeCompare(propB)
      : String(propB).localeCompare(propA)
  })
}
