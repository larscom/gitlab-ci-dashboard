import { GroupId } from '$models/group'
import { Status } from '$models/pipeline'
import { Project } from '$models/project'
import { useQuery } from 'react-query'

export const useProjects = (groupId?: GroupId) => {
  const url = `${location.origin}/api/groups/${groupId}/projects`
  return useQuery<Map<Status, Project[]>>(
    url,
    () =>
      groupId
        ? window
            .fetch(url)
            .then((r) => r.json())
            .then((r) => new Map(Object.entries(r)) as Map<Status, Project[]>)
        : new Map(),
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity
    }
  )
}
