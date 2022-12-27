import IndeterminateLoader from '$components/ui/IndeterminateLoader'
import { GroupContext } from '$groups/contexts/group-context'
import { useProjects } from '$groups/hooks/use-projects'
import { Stack } from '@mantine/core'
import { useContext, useEffect, useState } from 'react'
import { ProjectContextProvider } from './contexts/project-context'
import { Status } from './models/pipeline'
import { ProjectWithLatestPipeline } from './models/project-with-pipeline'
import PipelineStatusTabs from './PipelineStatusTabs'
import ProjectFilter from './projects/ProjectFilter'

const filterBy = (value: string, filterText: string): boolean =>
  value.toLocaleLowerCase().includes(filterText.toLocaleLowerCase())

const filterProjects = (
  data: Map<Status, ProjectWithLatestPipeline[]> | undefined,
  filterText: string,
  filterTopics: string[]
): Map<Status, ProjectWithLatestPipeline[]> => {
  if (!data) return new Map()

  return Array.from(data).reduce((current, [status, projects]) => {
    const filteredProjects = projects
      .filter(({ project: { name } }) => filterBy(name, filterText))
      .filter(({ project: { topics } }) => {
        return filterTopics.length
          ? filterTopics
              .map((filter) => topics.includes(filter))
              .every((b) => b)
          : true
      })

    return filteredProjects.length
      ? current.set(status, filteredProjects)
      : current
  }, new Map<Status, ProjectWithLatestPipeline[]>())
}

export default function PipelineOverview() {
  const { groupId } = useContext(GroupContext)
  const { isLoading, data } = useProjects(groupId)

  const [filterText, setFilterText] = useState<string>('')
  const [filterTopics, setFilterTopics] = useState<string[]>([])

  const statusWithProjects = filterProjects(data, filterText, filterTopics)

  useEffect(() => {
    setFilterTopics([])
    setFilterText('')
  }, [data])

  return (
    <Stack>
      <ProjectContextProvider value={{ statusWithProjects }}>
        {isLoading ? (
          <IndeterminateLoader />
        ) : (
          <>
            <ProjectFilter
              onTopicFilterChange={setFilterTopics}
              onFilterTextChange={setFilterText}
            ></ProjectFilter>
            <PipelineStatusTabs></PipelineStatusTabs>
          </>
        )}
      </ProjectContextProvider>
    </Stack>
  )
}
