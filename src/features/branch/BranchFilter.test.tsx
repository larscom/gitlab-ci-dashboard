import { BranchPipeline } from '$models/branch-pipeline'
import { createBranchWithPipeline } from '$test/objects'
import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import BranchFilter from './BranchFilter'

describe('BranchFilter', () => {
  const unfiltered: BranchPipeline[] = [
    createBranchWithPipeline('main'),
    createBranchWithPipeline('feature-1'),
    createBranchWithPipeline('feature-2')
  ]

  it('should render a SearchField with placeholder text "Search branches"', () => {
    const setBranchPipelines = vi.fn()

    render(
      <BranchFilter
        unfiltered={unfiltered}
        setBranchPipelines={setBranchPipelines}
      />
    )

    expect(setBranchPipelines).toHaveBeenCalledTimes(1)
    expect(screen.getByPlaceholderText('Search branches')).toBeInTheDocument()
  })

  it('should filter the list of branches when the user types in the search field', () => {
    const setBranchPipelines = vi.fn()

    render(
      <BranchFilter
        unfiltered={unfiltered}
        setBranchPipelines={setBranchPipelines}
      />
    )

    const searchField = screen.getByPlaceholderText('Search branches')
    fireEvent.change(searchField, { target: { value: 'feature' } })

    expect(setBranchPipelines).toHaveBeenCalledTimes(2)
    expect(setBranchPipelines).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          branch: expect.objectContaining({ name: 'feature-1' })
        }),
        expect.objectContaining({
          branch: expect.objectContaining({ name: 'feature-2' })
        })
      ])
    )
  })

  it('should not filter the list of branches when the SearchField is disabled', () => {
    const setBranchPipelines = vi.fn()

    render(
      <BranchFilter
        unfiltered={unfiltered}
        setBranchPipelines={setBranchPipelines}
        disabled
      />
    )

    const searchField = screen.getByPlaceholderText('Search branches')
    fireEvent.change(searchField, { target: { value: 'main' } })

    expect(setBranchPipelines).toHaveBeenCalledTimes(1)
    expect(setBranchPipelines).toHaveBeenCalledWith(unfiltered)
  })
})
