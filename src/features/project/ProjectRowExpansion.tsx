import AutoRefresh from '$components/AutoRefresh'
import IndeterminateLoader from '$components/ui/IndeterminateLoader'
import BranchFilter from '$feature/branch/BranchFilter'
import BranchWithPipelineTable from '$feature/branch/BranchWithPipelineTable'
import { useBranches } from '$hooks/use-branches'
import { BranchPipeline } from '$models/branch-pipeline'
import { ProjectPipeline } from '$models/project-pipeline'
import { Group, Stack } from '@mantine/core'
import { useMemo, useState } from 'react'

interface Props {
  project: ProjectPipeline
}

export default function ProjectRowExpansion({ project }: Props) {
  const {
    isLoading,
    isRefetching,
    refetch,
    data = []
  } = useBranches(project.project.id)

  const [branchPipelines, setBranchPipelines] = useState<BranchPipeline[]>([])

  const unfiltered = useMemo(
    () => data.filter(({ branch }) => !branch.default),
    [data]
  )

  return (
    <Stack className="p-3">
      <Group className="justify-between">
        <BranchFilter
          disabled={isLoading}
          unfiltered={unfiltered}
          setBranchPipelines={setBranchPipelines}
        />
        <AutoRefresh
          id="branch"
          loading={isRefetching}
          refetch={refetch}
          disabled={isLoading}
        />
      </Group>
      {isLoading ? (
        <IndeterminateLoader />
      ) : (
        <BranchWithPipelineTable branches={branchPipelines} />
      )}
    </Stack>
  )
}
