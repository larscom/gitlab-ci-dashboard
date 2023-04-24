import { renderHook, waitFor } from '@testing-library/react'
import { useBranches } from './use-branches'

import { Branch } from '$models/branch'
import { createBranch } from '$test/objects'
import { createWrapper } from '$test/react-query'

describe('useBranches', () => {
  it('should fetch branches', async () => {
    const projectId = 123
    const branches: Branch[] = [createBranch('test')]

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ json: () => Promise.resolve(branches) })

    const { result } = renderHook(() => useBranches(projectId), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(branches)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/branches/${projectId}`)
    )
  })
})
