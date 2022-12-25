import { Status } from '$groups/features/pipelines/models/pipeline'
import { ProjectWithLatestPipeline } from '$groups/features/pipelines/models/project-with-pipeline'
import { GroupId } from '$groups/models/group'
import { useQuery } from 'react-query'

export const useProjects = (groupId: GroupId) => {
  const url = `${location.origin}/api/groups/${groupId}/projects`
  return useQuery<Record<Status, ProjectWithLatestPipeline[]>>(
    url,
    () => fetch(url).then((r) => r.json()),
    {
      refetchOnMount: false,
      refetchOnWindowFocus: true,
      staleTime: 5000,
    }
  )
}
