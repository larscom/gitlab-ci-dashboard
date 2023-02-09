import { Status } from '$models/pipeline'
import { MantineColor } from '@mantine/core'

const COLOR_MAP: Record<Status, MantineColor> = {
  created: 'dark.6',
  waiting_for_resource: 'dark.6',
  preparing: 'indigo.6',
  pending: 'yellow.6',
  running: 'blue.6',
  success: 'green.6',
  failed: 'red.6',
  canceled: 'dark.6',
  skipped: 'orange.6',
  manual: 'cyan.6',
  scheduled: 'violet.6',
  unknown: 'gray.6'
}

export const statusToColor = (status: Status): MantineColor => COLOR_MAP[status]
