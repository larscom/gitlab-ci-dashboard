import { useQuery } from 'react-query'
import { GroupId } from '../models/group'
import { Pipeline, Status } from '../models/pipeline'
import { Project } from '../models/project'

export const useProjects = (groupId: GroupId) => {
  const url = `${location.origin}/api/groups/${groupId}/projects`
  return useQuery<Record<Status, [Project, Pipeline | undefined][]>>(
    url,
    () => fetch(url).then((r) => r.json()),
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    }
  )
}
