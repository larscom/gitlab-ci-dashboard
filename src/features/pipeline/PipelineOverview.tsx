import AutoRefresh from '$components/AutoRefresh'
import IndeterminateLoader from '$components/ui/IndeterminateLoader'
import { GroupContext } from '$contexts/group-context'
import ProjectFilter from '$feature/project/ProjectFilter'
import { useProjects } from '$hooks/use-projects'
import { Status } from '$models/pipeline'
import { ProjectPipeline } from '$models/project-pipeline'
import { filterBy } from '$util/filter-by'
import { Group, Stack } from '@mantine/core'
import { useCallback, useContext, useMemo, useState } from 'react'
import PipelineStatusTabs from './PipelineStatusTabs'

const filter = (
  data: Map<Status, ProjectPipeline[]> | undefined,
  filterText: string,
  filterTopics: string[]
): Map<Status, ProjectPipeline[]> => {
  if (!data) return new Map()

  return Array.from(data).reduce((current, [status, projects]) => {
    const filteredProjects = projects
      .filter(({ project: { name } }) => filterBy(name, filterText))
      .filter(({ project: { topics } }) => {
        return filterTopics.length
          ? filterTopics.map((filter) => topics.includes(filter)).every((b) => b)
          : true
      })

    return filteredProjects.length ? current.set(status, filteredProjects) : current
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
          disabled={isLoading}
          allProjects={Array.from(data.values()).flat()}
          filterText={filterText}
          // eslint-disable-next-line
          setFilterText={useCallback(setFilterText, [])}
          filterTopics={filterTopics}
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
