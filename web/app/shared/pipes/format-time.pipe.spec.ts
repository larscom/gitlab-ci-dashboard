import { FormatTimePipe } from './format-time.pipe'

describe('FormatTimePipe', () => {
  it('should format date time to en-US locale as fallback', () => {
    const actual = new FormatTimePipe().transform('2022-12-11T20:30:22.009Z')
    const expected = '12/11/22, 09:30:22 PM'

    expect(actual).toEqual(expected)
  })

  it('should format date time based on the browsers locale', () => {
    spyOnProperty(window.navigator, 'languages').and.returnValue(['nl-NL'])

    const actual = new FormatTimePipe().transform('2022-12-11T20:30:22.009Z')
    const expected = '11-12-22 21:30:22'

    expect(actual).toEqual(expected)
  })

  it('should return undefined if date time is undefined', () => {
    spyOnProperty(window.navigator, 'languages').and.returnValue(['nl-NL'])

    const actual = new FormatTimePipe().transform(undefined)
    const expected = undefined

    expect(actual).toEqual(expected)
  })
})
