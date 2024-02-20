import { Status } from '$groups/model/status'

type Color = string

const dark6 = '#25262B'
const colorMap = new Map<Status | string, Color>([
  [Status.CREATED, '#74C0FC'],
  [Status.WAITING_FOR_RESOURCE, '#CED4DA'],
  [Status.PREPARING, '#4C6EF5'],
  [Status.PENDING, '#15AABF'],
  [Status.RUNNING, '#228BE6'],
  [Status.SUCCESS, '#087f5b'],
  [Status.FAILED, '#FA5252'],
  [Status.CANCELED, '#FF8787'],
  [Status.SKIPPED, '#FD7E14'],
  [Status.MANUAL, '#FAB005'],
  [Status.SCHEDULED, '#7950F2'],
  [Status.FAILED_ALLOW_FAILURE, 'warning']
])

export function statusToColor(status?: Status | string): Color {
  return status ? colorMap.get(status) || dark6 : dark6
}
