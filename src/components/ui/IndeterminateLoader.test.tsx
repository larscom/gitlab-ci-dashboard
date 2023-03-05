import { render } from '@testing-library/react'

import IndeterminateLoader from './IndeterminateLoader'

describe('IndeterminateLoader', () => {
  it('should fully render', () => {
    const { container } = render(
      <IndeterminateLoader color="grape" size="xl" />
    )
    expect(container).toMatchSnapshot()
  })
})
