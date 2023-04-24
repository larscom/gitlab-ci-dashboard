import { render, screen } from '@testing-library/react'

import Version from './Version'

describe('Version', () => {
  it('should fetch and display version', async () => {
    const version = '1.1.1'

    global.fetch = vi.fn().mockResolvedValueOnce({ text: () => Promise.resolve(version) })

    render(<Version />)

    expect(global.fetch).toHaveBeenCalledWith('/api/version')

    expect(await screen.findByText(version)).toBeInTheDocument()
  })
})
