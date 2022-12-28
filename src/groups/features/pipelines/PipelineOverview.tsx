import IndeterminateLoader from '$components/ui/IndeterminateLoader'
import { GroupContext } from '$groups/contexts/group-context'
import { useProjects } from '$groups/hooks/use-projects'
import { Stack } from '@mantine/core'
import { useContext, useState } from 'react'
import { Status } from './models/pipeline'
import { ProjectWithLatestPipeline } from './models/project-with-pipeline'
import PipelineStatusTabs from './PipelineStatusTabs'
import ProjectFilter from './projects/ProjectFilter'

export default function PipelineOverview() {
  const { groupId } = useContext(GroupContext)
  const { isLoading, data: unfiltered } = useProjects(groupId)
  const [statusWithProjects, setStatusWithProjects] = useState(
    new Map<Status, ProjectWithLatestPipeline[]>()
  )

  return (
    <Stack>
      {isLoading ? (
        <IndeterminateLoader />
      ) : (
        <>
          <ProjectFilter
            unfiltered={unfiltered}
            setStatusWithProjects={setStatusWithProjects}
          />
          <PipelineStatusTabs statusWithProjects={statusWithProjects} />
        </>
      )}
    </Stack>
  )
}
