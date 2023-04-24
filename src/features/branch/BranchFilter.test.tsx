import { fireEvent, render, screen } from '@testing-library/react'

import BranchFilter from './BranchFilter'

describe('BranchFilter', () => {
  const setFilterText = vi.fn()

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search field with the correct props', () => {
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
    render(<BranchFilter filterText="test" setFilterText={setFilterText} />)

    expect(screen.getByPlaceholderText('Search branches')).toBeInTheDocument()
  })

  it('should call setFilterText when the search field value changes', () => {
    const filterText = 'test'

    render(<BranchFilter filterText={filterText} setFilterText={setFilterText} />)

    const searchField = screen.getByPlaceholderText('Search branches')
    const newFilterText = 'change'
    fireEvent.change(searchField, { target: { value: newFilterText } })

    expect(setFilterText).toHaveBeenCalledWith(newFilterText)
  })
})
