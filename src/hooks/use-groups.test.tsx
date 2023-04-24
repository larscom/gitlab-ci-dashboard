import { renderHook, waitFor } from '@testing-library/react'

import { Group } from '$models/group'
import { createGroup } from '$test/objects'
import { createWrapper } from '$test/react-query'
import { useGroups } from './use-groups'

describe('useGroups', () => {
  it('should fetch groups', async () => {
    const groups: Group[] = [createGroup(1, 'group-1')]

    global.fetch = vi.fn().mockResolvedValueOnce({ json: () => Promise.resolve(groups) })

    const { result } = renderHook(() => useGroups(), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(groups)
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/groups'))
  })
})
