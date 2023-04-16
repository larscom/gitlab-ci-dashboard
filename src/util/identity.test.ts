import { identity } from './identity'

describe('identity', () => {
  it('should identify', () => {
    expect(identity(true)).toBe(true)

    const obj = { key: 'value', array: [1, 2, 3] }
    expect(identity(obj)).toBe(obj)
  })
})
