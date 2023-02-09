import IndeterminateLoader from '$components/IndeterminateLoader'
import BranchWithPipelineTable from '$feature/branch/BranchWithPipelineTable'
import { useBranches } from '$hooks/use-branches'
import { ProjectWithLatestPipeline } from '$models/project-with-pipeline'
import { Stack } from '@mantine/core'

interface Props {
  project: ProjectWithLatestPipeline
}

export default function ProjectRowExpansion({ project }: Props) {
  const { isLoading: loading, data: branches = [] } = useBranches(
    project.project.id
  )

  if (loading) {
    return <IndeterminateLoader />
  }

  return (
    <Stack className='p-3'>
      <BranchWithPipelineTable
        branches={branches.filter(({ branch }) => !branch.default)}
      />
    </Stack>
  )
}
