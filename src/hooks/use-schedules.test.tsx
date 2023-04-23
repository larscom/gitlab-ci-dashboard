import { renderHook, waitFor } from '@testing-library/react'

import { createSchedule } from '$test/objects'
import { createWrapper } from '$test/react-query'
import { vi } from 'vitest'
import { useSchedules } from './use-schedules'

describe('useSchedules', () => {
  it('should fetch schedules', async () => {
    const groupId = 12

    const schedule = createSchedule('project-1')

    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve([schedule])
    })

    const { result } = renderHook(() => useSchedules(groupId), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([schedule])
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/groups/${groupId}/schedules`)
    )
  })

  it('should return empty list when groupId is undefined', async () => {
    const groupId = undefined

    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve()
    })

    const { result } = renderHook(() => useSchedules(groupId), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(global.fetch).not.toHaveBeenCalled()
    expect(result.current.data).toEqual([])
  })
})
