import { ForkOutlined, ScheduleOutlined } from '@ant-design/icons'
import { Stack, Tabs, Text } from '@mantine/core'
import { GroupId } from '../models/group'
import PipelineTabs from './PipelineTabs'
import Empty from './ui/Empty'

interface FeatureTabsProps {
  groupId: GroupId
}
export default function FeatureTabs({ groupId }: FeatureTabsProps) {
  return (
    <Tabs orientation="horizontal" variant="outline" defaultValue="pipelines">
      <Tabs.List>
        <Tabs.Tab value="pipelines" icon={<ForkOutlined size={14} />}>
          Pipelines
        </Tabs.Tab>
        <Tabs.Tab value="schedules" icon={<ScheduleOutlined size={14} />}>
          Schedules
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="pipelines" pt="xs">
        <PipelineTabs groupId={groupId}></PipelineTabs>
      </Tabs.Panel>

      <Tabs.Panel value="schedules" pt="xs">
        <Stack align="center">
          <Empty />
          <Text>Coming soon...</Text>
        </Stack>
      </Tabs.Panel>
    </Tabs>
  )
}
