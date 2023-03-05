import { Group } from '$models/group'
import { useQuery } from 'react-query'

export const useGroups = () => {
  const url = `${location.origin}/api/groups`
  return useQuery<Group[]>(url, () => window.fetch(url).then((r) => r.json()), {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity
  })
}
