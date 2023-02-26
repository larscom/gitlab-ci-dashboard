import IndeterminateLoader from '$components/ui/IndeterminateLoader'
import BranchFilter from '$feature/branch/BranchFilter'
import BranchWithPipelineTable from '$feature/branch/BranchWithPipelineTable'
import { useBranches } from '$hooks/use-branches'
import { BranchPipeline } from '$models/branch-pipeline'
import { ProjectPipeline } from '$models/project-pipeline'
import { Stack } from '@mantine/core'
import { useMemo, useState } from 'react'

interface Props {
  project: ProjectPipeline
}

export default function ProjectRowExpansion({ project }: Props) {
  const { isLoading, data = [] } = useBranches(project.project.id)
  const [branchPipelines, setBranchPipelines] = useState<BranchPipeline[]>([])

  const unfiltered = useMemo(
    () => data.filter(({ branch }) => !branch.default),
    [data]
  )

  return (
    <Stack className="p-3">
      <BranchFilter
        disabled={isLoading}
        unfiltered={unfiltered}
        setBranchPipelines={setBranchPipelines}
      />
      {isLoading ? (
        <IndeterminateLoader />
      ) : (
        <BranchWithPipelineTable branches={branchPipelines} />
      )}
    </Stack>
  )
}
