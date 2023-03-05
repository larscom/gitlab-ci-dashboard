import { GroupId } from '$models/group'
import { Status } from '$models/pipeline'
import { ProjectPipeline } from '$models/project-pipeline'
import { useQuery } from 'react-query'

export const useProjects = (groupId: GroupId) => {
  const url = `${location.origin}/api/groups/${groupId}/projects`
  return useQuery<Map<Status, ProjectPipeline[]>>(
    url,
    () =>
      window
        .fetch(url)
        .then((r) => r.json())
        .then((r) => new Map(Object.entries(r)) as Map<Status, ProjectPipeline[]>),
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity
    }
  )
}
