import { BranchPipeline } from '$models/branch-pipeline'
import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import BranchFilter from './BranchFilter'

const unfiltered: BranchPipeline[] = [
  {
    branch: {
      name: 'main',
      merged: false,
      protected: true,
      default: true,
      canPush: false,
      webUrl: 'https://example.com/main',
      commit: {
        id: 'abc123',
        authorName: 'Alice',
        committerName: 'Bob',
        committedDate: '2022-01-01T00:00:00Z',
        title: 'Initial commit',
        message: 'This is the initial commit'
      }
    }
  },
  {
    branch: {
      name: 'feature-1',
      merged: false,
      protected: false,
      default: false,
      canPush: true,
      webUrl: 'https://example.com/feature-1',
      commit: {
        id: 'def456',
        authorName: 'Bob',
        committerName: 'Charlie',
        committedDate: '2022-01-02T00:00:00Z',
        title: 'Add feature 1',
        message: 'This adds feature 1 to the codebase'
      }
    }
  },
  {
    branch: {
      name: 'feature-2',
      merged: true,
      protected: false,
      default: false,
      canPush: true,
      webUrl: 'https://example.com/feature-2',
      commit: {
        id: 'ghi789',
        authorName: 'Charlie',
        committerName: 'David',
        committedDate: '2022-01-03T00:00:00Z',
        title: 'Add feature 2',
        message: 'This adds feature 2 to the codebase'
      }
    }
  }
]

describe('BranchFilter', () => {
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
