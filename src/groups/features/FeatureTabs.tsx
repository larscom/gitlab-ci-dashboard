import Empty from '$components/ui/Empty'
import { ForkOutlined, ScheduleOutlined } from '@ant-design/icons'
import { Stack, Tabs, Text } from '@mantine/core'
import PipelineOverview from './pipelines/PipelineOverview'

export default function FeatureTabs() {
  return (
    <Tabs orientation="vertical" variant="default" defaultValue="pipelines">
      <Tabs.List>
        <Tabs.Tab value="pipelines" icon={<ForkOutlined size={14} />}>
          Pipelines
        </Tabs.Tab>
        <Tabs.Tab value="schedules" icon={<ScheduleOutlined size={14} />}>
          Schedules
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="pipelines" ml={5}>
        <PipelineOverview />
      </Tabs.Panel>

      <Tabs.Panel value="schedules" ml={5}>
        <Stack align="center">
          <Empty />
          <Text>Coming soon...</Text>
        </Stack>
      </Tabs.Panel>
    </Tabs>
  )
}
