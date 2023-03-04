import { filterBy } from './filter-by'

describe('filter-by', () => {
  it('should return true if value contains filterText ignoring casing', () => {
    const value = 'Hello'
    const filterText = 'hell'

    expect(filterBy(value, filterText)).toBeTruthy()
  })

  it('should return false if value does not contain filterText', () => {
    const value = 'Hello'
    const filterText = 'g'

    expect(filterBy(value, filterText)).toBeFalsy()
  })
})
