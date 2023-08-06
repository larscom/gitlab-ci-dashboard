import { Status } from '$model/pipeline'

type Color = string

const dark6 = '#25262B'
const colorMap = new Map<Status, Color>([
  [Status.CREATED, dark6],
  [Status.WAITING_FOR_RESOURCE, dark6],
  [Status.PREPARING, '#4C6EF5'],
  [Status.PENDING, '#FAB005'],
  [Status.RUNNING, '#228BE6'],
  [Status.SUCCESS, '#40C057'],
  [Status.FAILED, '#FA5252'],
  [Status.CANCELED, dark6],
  [Status.SKIPPED, '#FD7E14'],
  [Status.MANUAL, '#15AABF'],
  [Status.SCHEDULED, '#7950F2'],
  [Status.UNKNOWN, '#868E96']
])

export function statusToColor(status?: Status): Color {
  return status ? colorMap.get(status) || dark6 : dark6
}
