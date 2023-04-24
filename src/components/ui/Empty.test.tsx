import { render } from '@testing-library/react'

import Empty from './Empty'

describe('Empty', () => {
  it('should fully render', () => {
    const { container } = render(<Empty />)
    expect(container).toMatchSnapshot()
  })
})
