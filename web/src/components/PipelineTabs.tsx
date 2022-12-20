import {
  Badge,
  MantineColor,
  Stack,
  Tabs,
  TabsValue,
  Text,
} from '@mantine/core'
import { useEffect, useState } from 'react'
import { useProjects } from '../hooks/use-projects'
import { GroupId } from '../models/group'
import type { Status } from '../models/pipeline'
import Empty from './ui/Empty'
import Loader from './ui/Loader'

interface PipelineTabsProps {
  groupId: GroupId
}

const colorMap: Record<Status, MantineColor> = {
  created: 'dark.6',
  waiting_for_resource: 'dark.6',
  preparing: 'indigo.6',
  pending: 'yellow.6',
  running: 'blue.6',
  success: 'green.6',
  failed: 'red.6',
  canceled: 'pink.6',
  skipped: 'orange.6',
  manual: 'cyan.6',
  scheduled: 'violet.6',
  unknown: 'gray.6',
}

export default function PipelineTabs({ groupId }: PipelineTabsProps) {
  const { isLoading: loading, data } = useProjects(groupId)
  const [status, setStatus] = useState<string>('unknown')

  useEffect(() => {
    const statuses = Object.keys(data || {})
    if (statuses.length) {
      setStatus(statuses[0])
    }
  }, [data])

  if (loading) {
    return <Loader />
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <Stack align="center">
        <Empty />
        <Text>No projects found...</Text>
      </Stack>
    )
  }

  const tabs = Object.entries(data)
    .filter(([_, projects]) => projects.length > 0)
    .map(([status, projects]) => ({ status: status as Status, projects }))
    .sort((a, b) => a.status.localeCompare(b.status))
    .map(({ status, projects }) => {
      return (
        <Tabs.Tab
          key={status}
          value={status}
          color={colorMap[status]}
          rightSection={
            <Badge
              color={colorMap[status]}
              sx={{ width: 16, height: 16, pointerEvents: 'none' }}
              variant="filled"
              size="xs"
              p={0}
            >
              {projects.length}
            </Badge>
          }
        >
          <span className="capitalize">{status}</span>
        </Tabs.Tab>
      )
    })

  const handleChange = (status: TabsValue) => setStatus(String(status))

  return (
    <Tabs value={status} onTabChange={handleChange}>
      <Tabs.List>{tabs}</Tabs.List>
      <Tabs.Panel value={status} pt="xs">
        <p>Status: {status}</p>
        <p>GroupId: {groupId}</p>
      </Tabs.Panel>
    </Tabs>
  )
}
