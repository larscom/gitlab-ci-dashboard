import IndeterminateLoader from '$components/ui/IndeterminateLoader'
import { GroupContext } from '$groups/contexts/group-context'
import { useProjects } from '$groups/hooks/use-projects'
import { Stack } from '@mantine/core'
import { useContext } from 'react'
import { ProjectContextProvider } from './contexts/project-context'
import PipelineStatusTabs from './PipelineStatusTabs'
import ProjectFilter from './projects/ProjectFilter'

export default function PipelineOverview() {
  const { groupId } = useContext(GroupContext)
  const { isLoading, data } = useProjects(groupId)

  return (
    <Stack>
      <ProjectContextProvider
        value={{
          statusWithProjects: data || new Map(),
          filterText: '',
          filterTopics: [],
        }}
      >
        <ProjectFilter></ProjectFilter>
        {isLoading ? (
          <IndeterminateLoader />
        ) : (
          <PipelineStatusTabs></PipelineStatusTabs>
        )}
      </ProjectContextProvider>
    </Stack>
  )
}
