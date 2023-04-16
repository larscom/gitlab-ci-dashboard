import AutoRefresh from '$components/AutoRefresh'
import IndeterminateLoader from '$components/ui/IndeterminateLoader'
import BranchFilter from '$feature/branch/BranchFilter'
import BranchTable from '$feature/branch/BranchTable'
import { useBranches } from '$hooks/use-branches'
import { Project } from '$models/project'
import { filterBy } from '$util/filter-by'
import { Group, Stack } from '@mantine/core'
import { useCallback, useMemo, useState } from 'react'

interface Props {
  project: Project
}

export default function ProjectRowExpansion({ project }: Props) {
  const { isLoading, isRefetching, refetch, data = [] } = useBranches(project.id)
  const [filterText, setFilterText] = useState<string>('')

  const branches = useMemo(
    () =>
      data
        .filter(({ default: d }) => !d)
        .filter(({ name }) => filterBy(name, filterText)),
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
      {isLoading ? <IndeterminateLoader /> : <BranchTable branches={branches} />}
    </Stack>
  )
}
