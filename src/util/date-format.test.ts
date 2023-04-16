import { formatDateTime } from './date-format'

describe('date-format', () => {
  it('should properly format UTC date', () => {
    const dateTime = '2023-03-04T11:53:47.267Z'

    expect(formatDateTime(dateTime)).toEqual('Mar 4, 2023, 11:53:47')
  })

  it('should properly format to Europe/Amsterdam date', () => {
    const dateTime = '2023-03-04T11:53:47.267Z'

    expect(formatDateTime(dateTime, 'Europe/Amsterdam')).toEqual('Mar 4, 2023, 12:53:47')
  })
})
