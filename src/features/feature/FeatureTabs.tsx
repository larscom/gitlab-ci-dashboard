import Empty from '$components/ui/Empty'
import PipelineOverview from '$feature/pipeline/PipelineOverview'
import ScheduleOverview from '$feature/schedule/ScheduleOverview'
import { FileZipOutlined, NodeExpandOutlined, ScheduleOutlined } from '@ant-design/icons'
import { Stack, Tabs, Text } from '@mantine/core'

export default function FeatureTabs() {
  return (
    <Tabs
      keepMounted={false}
      orientation="vertical"
      variant="default"
      defaultValue="pipelines"
    >
      <Tabs.List>
        <Tabs.Tab value="pipelines" icon={<NodeExpandOutlined />}>
          Pipelines (latest)
        </Tabs.Tab>
        <Tabs.Tab value="schedules" icon={<ScheduleOutlined />}>
          Schedules
        </Tabs.Tab>
        <Tabs.Tab value="artifacts" icon={<FileZipOutlined />}>
          Artifacts
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="pipelines" ml={5}>
        <PipelineOverview />
      </Tabs.Panel>

      <Tabs.Panel value="schedules" ml={5}>
        <ScheduleOverview />
      </Tabs.Panel>

      <Tabs.Panel value="artifacts" ml={5}>
        <Stack align="center">
          <Empty />
          <Text>Coming soon...</Text>
        </Stack>
      </Tabs.Panel>
    </Tabs>
  )
}
