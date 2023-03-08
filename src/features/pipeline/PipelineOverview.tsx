import AutoRefresh from '$components/AutoRefresh'
import IndeterminateLoader from '$components/ui/IndeterminateLoader'
import { GroupContext } from '$contexts/group-context'
import ProjectFilter from '$feature/project/ProjectFilter'
import { useProjects } from '$hooks/use-projects'
import { Status } from '$models/pipeline'
import { ProjectPipeline } from '$models/project-pipeline'
import { filterBy } from '$util/filter-by'
import { identity } from '$util/identity'
import { Group, Stack } from '@mantine/core'
import { useCallback, useContext, useMemo, useState } from 'react'
import PipelineStatusTabs from './PipelineStatusTabs'

const filter = (
  data: Map<Status, ProjectPipeline[]>,
  filterText: string,
  filterTopics: string[]
): Map<Status, ProjectPipeline[]> => {
  return Array.from(data).reduce((current, [status, projects]) => {
    const filtered = projects
      .filter(({ project: { name } }) => filterBy(name, filterText))
      .filter(({ project: { topics } }) => {
        return filterTopics.length
          ? filterTopics.map((filter) => topics.includes(filter)).every(identity)
          : true
      })

    return filtered.length ? current.set(status, filtered) : current
  }, new Map<Status, ProjectPipeline[]>())
}

export default function PipelineOverview() {
  const { groupId } = useContext(GroupContext)

  const [filterText, setFilterText] = useState<string>('')
  const [filterTopics, setFilterTopics] = useState<string[]>([])

  const {
    isLoading,
    data = new Map<Status, ProjectPipeline[]>(),
    refetch,
    isRefetching
  } = useProjects(groupId)

  const statusWithProjects = useMemo(
    () => filter(data, filterText, filterTopics),
    [data, filterText, filterTopics]
  )

  return (
    <Stack>
      <Group className="justify-between">
        <ProjectFilter
          projects={Array.from(data.values()).flat()}
          disabled={isLoading}
          groupId={groupId}
          filterText={filterText}
          filterTopics={filterTopics}
          // eslint-disable-next-line
          setFilterText={useCallback(setFilterText, [])}
          // eslint-disable-next-line
          setFilterTopics={useCallback(setFilterTopics, [])}
        />
        <AutoRefresh
          id="project"
          loadingColor="teal"
          loading={isRefetching}
          refetch={refetch}
          disabled={isLoading}
        />
      </Group>
      {isLoading ? (
        <IndeterminateLoader />
      ) : (
        <PipelineStatusTabs statusWithProjects={statusWithProjects} />
      )}
    </Stack>
  )
}
