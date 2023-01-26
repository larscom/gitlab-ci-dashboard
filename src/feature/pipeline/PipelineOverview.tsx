import IndeterminateLoader from '$components/IndeterminateLoader'
import { GroupContext } from '$contexts/group-context'
import ProjectFilter from '$feature/project/ProjectFilter'
import { useProjects } from '$hooks/use-projects'
import { Status } from '$models/pipeline'
import { ProjectWithLatestPipeline } from '$models/project-with-pipeline'
import { Stack } from '@mantine/core'
import { useContext, useState } from 'react'
import PipelineStatusTabs from './PipelineStatusTabs'

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
