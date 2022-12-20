import { useQuery } from 'react-query'
import { GroupId } from '../models/group'
import { Status } from '../models/pipeline'
import { ProjectWithLatestPipeline } from '../models/project-with-pipeline'

export const useProjects = (groupId: GroupId) => {
  const url = `${location.origin}/api/groups/${groupId}/projects`
  return useQuery<Record<Status, ProjectWithLatestPipeline[]>>(
    url,
    () => fetch(url).then((r) => r.json()),
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    }
  )
}
