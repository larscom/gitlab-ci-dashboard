import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import BranchFilter from './BranchFilter'

describe('BranchFilter', () => {
  it('renders the search field with the correct props', () => {
    const setFilterText = vi.fn()
    const filterText = 'test'

    render(
      <BranchFilter
        filterText={filterText}
        setFilterText={setFilterText}
        disabled={true}
      />
    )

    const searchField = screen.getByPlaceholderText('Search branches')
    expect(searchField).toHaveValue(filterText)
    expect(searchField).toBeDisabled()
  })

  it('should render a SearchField with placeholder text "Search branches"', () => {
    const setFilterText = vi.fn()

    render(<BranchFilter filterText="test" setFilterText={setFilterText} />)

    expect(screen.getByPlaceholderText('Search branches')).toBeInTheDocument()
  })

  it('should call setFilterText when the search field value changes', () => {
    const setFilterText = vi.fn()
    const filterText = 'test'

    render(<BranchFilter filterText={filterText} setFilterText={setFilterText} />)

    const searchField = screen.getByPlaceholderText('Search branches')
    const newFilterText = 'change'
    fireEvent.change(searchField, { target: { value: newFilterText } })

    expect(setFilterText).toHaveBeenCalledWith(newFilterText)
  })
})
