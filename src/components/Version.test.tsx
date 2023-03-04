import { render, screen } from '@testing-library/react'
import Version from './Version'

describe('Version', () => {
  it('should fetch and display version', () => {
    render(<Version />)
    expect(screen.getByText(/Hello Vite \+ React!/i)).toBeInTheDocument()
  })
})
