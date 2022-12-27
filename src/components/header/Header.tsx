import { DashboardOutlined, GithubOutlined } from '@ant-design/icons'
import { ActionIcon, Group, Header as H, Text, Tooltip } from '@mantine/core'
import Version from './Version'

export default function Header() {
  const handleClick = () =>
    window.open('https://github.com/larscom/gitlab-ci-dashboard', '_blank')

  return (
    <H
      height={60}
      className="flex items-center justify-between bg-blue-600"
      p="md"
    >
      <Group spacing="xs" align="baseline">
        <DashboardOutlined className="text-white text-xl" />
        <Text className="text-white" size="md">
          Gitlab CI Dashboard
        </Text>
      </Group>
      <Group className="items-baseline" spacing="xs">
        <Version />
        <ActionIcon onClick={handleClick} variant="transparent">
          <Tooltip openDelay={250} label="Source code">
            <GithubOutlined className="text-white text-xl" />
          </Tooltip>
        </ActionIcon>
      </Group>
    </H>
  )
}
