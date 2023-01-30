import Empty from '$components/Empty'
import ProjectsWithPipelineTable from 'src/features/project/ProjectsWithPipelineTable'
import { Status } from '$models/pipeline'
import { ProjectWithLatestPipeline } from '$models/project-with-pipeline'
import {
  Badge,
  MantineColor,
  Stack,
  Tabs,
  TabsValue,
  Text
} from '@mantine/core'
import { useEffect, useState } from 'react'

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
  unknown: 'gray.6'
}

interface Props {
  statusWithProjects: Map<Status, ProjectWithLatestPipeline[]>
}
export default function PipelineStatusTabs({ statusWithProjects }: Props) {
  const [status, setStatus] = useState<Status | undefined>()

  useEffect(() => {
    setStatus(Array.from(statusWithProjects.keys()).sort()[0])
  }, [statusWithProjects])

  if (statusWithProjects.size === 0) {
    return (
      <Stack align="center">
        <Empty />
        <Text>No projects found...</Text>
      </Stack>
    )
  }

  const tabs = Array.from(statusWithProjects)
    .map(([status, projects]) => ({ status, projects }))
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

  const projects = status ? statusWithProjects.get(status) || [] : []

  return status ? (
    <Tabs value={status} onTabChange={handleChange}>
      <Tabs.List>{tabs}</Tabs.List>
      <Tabs.Panel value={status} pt="xs">
        <ProjectsWithPipelineTable projects={projects} />
      </Tabs.Panel>
    </Tabs>
  ) : null
}
