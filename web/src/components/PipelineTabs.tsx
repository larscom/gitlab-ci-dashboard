import { Badge, Stack, Tabs, TabsValue, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useProjects } from '../hooks/use-projects'
import { GroupId } from '../models/group'
import { Status } from '../models/pipeline'
import Empty from './ui/Empty'
import Loader from './ui/Loader'

interface PipelineTabsProps {
  groupId: GroupId
}

export default function PipelineTabs({ groupId }: PipelineTabsProps) {
  const { isLoading: loading, data } = useProjects(groupId)
  const [status, setStatus] = useState<Status>('unknown')

  useEffect(() => {
    const statuses = Object.keys(data || {})
    if (statuses.length) {
      setStatus(statuses[0] as Status)
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
    .map(([status, projects]) => ({ status, projects }))
    .sort((a, b) => a.status.localeCompare(b.status))
    .map(({ status, projects }) => {
      return (
        <Tabs.Tab
          key={status}
          value={status}
          rightSection={
            <Badge
              sx={{ width: 16, height: 16, pointerEvents: 'none' }}
              variant="light"
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

  const handleChange = (status: TabsValue) => setStatus(status as Status)

  return (
    <Tabs value={status} onTabChange={handleChange}>
      <Tabs.List>{tabs}</Tabs.List>
      <Tabs.Panel value={status} pt="xs">
        <p>Ook maar de status: {status}</p>
        <p>GroupId: {groupId}</p>
      </Tabs.Panel>
    </Tabs>
  )
}
