import { useQuery } from 'react-query'
import { Group } from '../models/group'

export const useGroups = () => {
  const url = `${location.origin}/api/groups`
  return useQuery<Group[]>(url, () => fetch(url).then((r) => r.json()), {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })
}
