import AutoRefresh from '$components/AutoRefresh'
import IndeterminateLoader from '$components/ui/IndeterminateLoader'
import BranchFilter from '$feature/branch/BranchFilter'
import BranchWithPipelineTable from '$feature/branch/BranchWithPipelineTable'
import { useBranches } from '$hooks/use-branches'
import { ProjectPipeline } from '$models/project-pipeline'
import { filterBy } from '$util/filter-by'
import { Group, Stack } from '@mantine/core'
import { useCallback, useMemo, useState } from 'react'

interface Props {
  project: ProjectPipeline
}

export default function ProjectRowExpansion({ project: { project } }: Props) {
  const { isLoading, isRefetching, refetch, data = [] } = useBranches(project.id)
  const [filterText, setFilterText] = useState<string>('')

  const branches = useMemo(
    () =>
      data
        .filter(({ branch }) => !branch.default)
        .filter(({ branch }) => filterBy(branch.name, filterText)),
    [data, filterText]
  )

  return (
    <Stack className="p-3">
      <Group className="justify-between">
        <BranchFilter
          disabled={isLoading}
          // eslint-disable-next-line
          setFilterText={useCallback(setFilterText, [])}
          filterText={filterText}
        />
        <AutoRefresh
          id="branch"
          loadingColor="teal"
          loading={isRefetching}
          refetch={refetch}
          disabled={isLoading}
        />
      </Group>
      {isLoading ? (
        <IndeterminateLoader />
      ) : (
        <BranchWithPipelineTable branches={branches} />
      )}
    </Stack>
  )
}
