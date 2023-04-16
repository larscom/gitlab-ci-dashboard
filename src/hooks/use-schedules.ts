import { GroupId } from '$models/group'
import { Schedule } from '$models/schedule'
import { useQuery } from 'react-query'

export const useSchedules = (groupId?: GroupId) => {
  const url = `${location.origin}/api/groups/${groupId}/schedules`
  return useQuery<Schedule[]>(
    url,
    () => (groupId ? window.fetch(url).then((r) => r.json()) : []),
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity
    }
  )
}
