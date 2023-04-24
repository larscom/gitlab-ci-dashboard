import { render, screen, fireEvent } from '@testing-library/react'
import SearchField from './SearchField'

describe('SearchField', () => {
  const onChange = vi.fn()

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<SearchField value="" onChange={onChange} />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('displays the correct placeholder', () => {
    const placeholder = 'Search...'

    render(<SearchField placeholder={placeholder} value="" onChange={onChange} />)

    expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument()
  })

  it('displays the correct value', () => {
    const value = 'React'

    render(<SearchField value={value} onChange={onChange} />)

    expect(screen.getByDisplayValue(value)).toBeInTheDocument()
  })

  it('calls onChange when the input value changes', () => {
    const newValue = 'React Hooks'

    render(<SearchField value="" onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: newValue } })

    expect(onChange).toHaveBeenCalledWith(newValue)
  })

  it('disables the input when disabled prop is passed', () => {
    render(<SearchField value="" onChange={onChange} disabled />)

    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('does not call onChange when input is disabled', () => {
    render(<SearchField value="" onChange={onChange} disabled />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'React' } })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('clears the input value when reset icon is clicked', async () => {
    const value = 'React Hooks'

    render(<SearchField value={value} onChange={onChange} />)

    fireEvent.click(screen.getByLabelText('close-square'))
    
    expect(onChange).toHaveBeenCalledWith('')
  })
})
