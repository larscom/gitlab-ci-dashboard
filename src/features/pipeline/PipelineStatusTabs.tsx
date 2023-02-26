import Empty from '$components/ui/Empty'
import { GroupContext } from '$contexts/group-context'
import ProjectsWithPipelineTable from '$feature/project/ProjectWithPipelineTable'
import { Status } from '$models/pipeline'
import { ProjectPipeline } from '$models/project-pipeline'
import { statusToColor } from '$util/status-to-color'
import { Badge, Stack, Tabs, TabsValue, Text } from '@mantine/core'
import { useContext, useEffect, useRef, useState } from 'react'

interface Props {
  statusWithProjects: Map<Status, ProjectPipeline[]>
}
export default function PipelineStatusTabs({ statusWithProjects }: Props) {
  const [status, setStatus] = useState<Status | undefined>()
  const { groupId } = useContext(GroupContext)
  const previousGroupId = useRef(groupId)

  useEffect(() => {
    setStatus((current) => {
      const allStatuses = Array.from(statusWithProjects.keys()).sort()
      const first = allStatuses[0]

      if (!current) return first

      if (groupId !== previousGroupId.current) {
        return first
      }
      previousGroupId.current = groupId

      return allStatuses.includes(current) ? current : first
    })
  }, [statusWithProjects, groupId])

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
          color={statusToColor(status)}
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
          color={statusToColor(status)}
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
