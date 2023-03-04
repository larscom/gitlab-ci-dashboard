import AutoRefresh from '$components/AutoRefresh'
import IndeterminateLoader from '$components/ui/IndeterminateLoader'
import { GroupContext } from '$contexts/group-context'
import ProjectFilter from '$feature/project/ProjectFilter'
import { useProjects } from '$hooks/use-projects'
import { Status } from '$models/pipeline'
import { ProjectPipeline } from '$models/project-pipeline'
import { Group, Stack } from '@mantine/core'
import { useContext, useState } from 'react'
import PipelineStatusTabs from './PipelineStatusTabs'

export default function PipelineOverview() {
  const { groupId } = useContext(GroupContext)
  const {
    isLoading,
    data: unfiltered,
    refetch,
    isRefetching
  } = useProjects(groupId)
  const [statusWithProjects, setStatusWithProjects] = useState(
    new Map<Status, ProjectPipeline[]>()
  )

  return (
    <Stack>
      <Group className="justify-between">
        <ProjectFilter
          disabled={isLoading}
          unfiltered={unfiltered}
          setStatusWithProjects={setStatusWithProjects}
        />
        <AutoRefresh
          id="project"
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
