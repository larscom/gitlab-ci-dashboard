import { identity } from './identity'

describe('identity', () => {
  it('boolean', () => {
    expect(identity(true)).toBe(true)
    expect(identity(false)).toBe(false)
  })

  it('string', () => {
    expect(identity('value')).toBe('value')
  })

  it('object', () => {
    const obj = { key: 'value', array: [1, 2, 3] }
    expect(identity(obj)).toBe(obj)
  })
})
