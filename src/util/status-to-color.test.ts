import { Status } from '$models/pipeline'
import { statusToColor } from './status-to-color'

describe('status-to-color', () => {
  it('should return a color for each status', () => {
    expect(statusToColor(Status.CREATED)).toEqual('dark.6')
    expect(statusToColor(Status.WAITING_FOR_RESOURCE)).toEqual('dark.6')
    expect(statusToColor(Status.PREPARING)).toEqual('indigo.6')
    expect(statusToColor(Status.PENDING)).toEqual('yellow.6')
    expect(statusToColor(Status.RUNNING)).toEqual('blue.6')
    expect(statusToColor(Status.SUCCESS)).toEqual('green.6')
    expect(statusToColor(Status.FAILED)).toEqual('red.6')
    expect(statusToColor(Status.CANCELED)).toEqual('dark.6')
    expect(statusToColor(Status.SKIPPED)).toEqual('orange.6')
    expect(statusToColor(Status.MANUAL)).toEqual('cyan.6')
    expect(statusToColor(Status.SCHEDULED)).toEqual('violet.6')
    expect(statusToColor(Status.UNKNOWN)).toEqual('gray.6')
  })
})
