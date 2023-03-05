import { BranchPipeline } from '$models/branch-pipeline'
import { ProjectId } from '$models/project'
import { useQuery } from 'react-query'

export const useBranches = (projectId: ProjectId) => {
  const url = `${location.origin}/api/branches/${projectId}`
  return useQuery<BranchPipeline[]>(
    url,
    () => window.fetch(url).then((r) => r.json()),
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity
    }
  )
}
