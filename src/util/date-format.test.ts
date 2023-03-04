import { formatDateTime } from './date-format'

describe('date-format', () => {
  it('should properly format date', () => {
    const dateTime = '2023-03-04T11:53:47.267Z'

    expect(formatDateTime(dateTime)).toEqual('Mar 4, 2023, 12:53:47')
  })
})
