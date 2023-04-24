import { fireEvent, render, screen } from '@testing-library/react'
import Header from './Header'

global.fetch = vi.fn().mockResolvedValue({ text: () => Promise.resolve() })

describe('Header', () => {
  it('displays the correct title', () => {
    render(<Header />)

    expect(screen.getByText('Gitlab CI Dashboard')).toBeInTheDocument()
  })

  it('opens the GitHub repository when the GitHub icon is clicked', () => {
    global.open = vi.fn()

    render(<Header />)

    fireEvent.click(screen.getByLabelText('github'))

    expect(window.open).toHaveBeenCalledWith(
      'https://github.com/larscom/gitlab-ci-dashboard',
      '_blank'
    )
  })
})
