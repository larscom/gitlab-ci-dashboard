import Empty from '$components/ui/Empty'
import IndeterminateLoader from '$components/ui/IndeterminateLoader'
import { GroupContext } from '$groups/contexts/group-context'
import { useProjects } from '$groups/hooks/use-projects'
import {
  Badge,
  MantineColor,
  Stack,
  Tabs,
  TabsValue,
  Text,
} from '@mantine/core'
import { useContext, useState } from 'react'
import { Status } from './models/pipeline'
import ProjectsWithPipelineTable from './projects/ProjectsWithPipelineTable'

const COLOR_MAP: Record<Status, MantineColor> = {
  created: 'dark.6',
  waiting_for_resource: 'dark.6',
  preparing: 'indigo.6',
  pending: 'yellow.6',
  running: 'blue.6',
  success: 'green.6',
  failed: 'red.6',
  canceled: 'dark.6',
  skipped: 'orange.6',
  manual: 'cyan.6',
  scheduled: 'violet.6',
  unknown: 'gray.6',
}

export default function PipelineStatusTabs() {
  const { groupId } = useContext(GroupContext)
  const { isLoading: loading, data } = useProjects(groupId)
  const [status, setStatus] = useState<Status | undefined>()

  if (loading || !data) {
    return <IndeterminateLoader />
  }

  const statuses = Object.keys(data) as Status[]
  if (statuses.length === 0) {
    return (
      <Stack align="center">
        <Empty />
        <Text>No projects found...</Text>
      </Stack>
    )
  }

  const projects = data[status as Status] || []
  if (!projects.length) {
    setStatus(statuses[0])
  }

  const tabs = Object.entries(data)
    .map(([status, projects]) => ({ status: status as Status, projects }))
    .sort((a, b) => a.status.localeCompare(b.status))
    .map(({ status, projects }) => {
      const badge = (
        <Badge
          color={COLOR_MAP[status]}
          sx={{ width: 16, height: 16, pointerEvents: 'none' }}
          variant="filled"
          size="xs"
          p={0}
        >
          {projects.length}
        </Badge>
      )
      return (
        <Tabs.Tab
          key={status}
          value={status}
          color={COLOR_MAP[status]}
          rightSection={badge}
        >
          <Text className="capitalize">{status}</Text>
        </Tabs.Tab>
      )
    })

  const handleChange = (status: TabsValue) => setStatus(status as Status)

  return status ? (
    <Tabs value={status} onTabChange={handleChange}>
      <Tabs.List>{tabs}</Tabs.List>
      <Tabs.Panel value={status} pt="xs">
        <ProjectsWithPipelineTable projects={projects} />
      </Tabs.Panel>
    </Tabs>
  ) : null
}
