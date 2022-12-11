import { filterBy } from './filters'

describe('filters', () => {
  it('should return true if a part of the filterText is in value', () => {
    const value = 'hello world'
    const filterText = 'world'
    expect(filterBy(value, filterText)).toBeTrue()
  })

  it('should return true if a part of the filterText is in value IGNORING case both ways', () => {
    expect(filterBy('hello WORLD', 'world')).toBeTrue()
    expect(filterBy('hello world', 'WORLD')).toBeTrue()
  })
})
