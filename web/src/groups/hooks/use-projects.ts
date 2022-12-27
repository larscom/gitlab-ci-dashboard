import { Status } from '$groups/features/pipelines/models/pipeline'
import { ProjectWithLatestPipeline } from '$groups/features/pipelines/models/project-with-pipeline'
import { GroupId } from '$groups/models/group'
import { useQuery } from 'react-query'

export const useProjects = (groupId: GroupId) => {
  const url = `${location.origin}/api/groups/${groupId}/projects`
  return useQuery<Map<Status, ProjectWithLatestPipeline[]>>(
    url,
    () =>
      fetch(url)
        .then((r) => r.json())
        .then((r) => {
          return new Map(Object.entries(r)) as Map<
            Status,
            ProjectWithLatestPipeline[]
          >
        }),
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 5000,
    }
  )
}
