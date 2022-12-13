import { ArrayToStringPipe } from './array-to-string.pipe'

describe('ArrayToStringPipe', () => {
  it('should return comma seperated string by default', () => {
    const actual = new ArrayToStringPipe().transform(['a', 'b'])
    const expected = 'a,b'

    expect(actual).toEqual(expected)
  })

  it('should return "-" when array is empty', () => {
    const actual = new ArrayToStringPipe().transform([])
    const expected = '-'

    expect(actual).toEqual(expected)
  })

  it('should return "-" when array is undefined', () => {
    const actual = new ArrayToStringPipe().transform(undefined)
    const expected = '-'

    expect(actual).toEqual(expected)
  })

  it('should return string with custom seprator', () => {
    const actual = new ArrayToStringPipe().transform(['a', 'b'], '|')
    const expected = 'a|b'

    expect(actual).toEqual(expected)
  })
})
