import { GithubOutlined, DashboardOutlined } from '@ant-design/icons'
import {
  ActionIcon,
  AppShell,
  Group,
  Header,
  MantineProvider,
  Text,
  Tooltip,
} from '@mantine/core'
import Version from './components/Version'

export default function App() {
  const handleClick = () =>
    window.open('https://github.com/larscom/gitlab-ci-dashboard', '_blank')

  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <AppShell
        fixed
        styles={{
          main: {
            background: '#FFFFFF',
            width: '100vw',
            height: '100vh',
            paddingLeft: '0px',
          },
        }}
        header={
          <Header
            height={60}
            className="flex items-center justify-between bg-blue-700"
            p="md"
          >
            <Group spacing="xs">
              <DashboardOutlined className="text-white text-xl" />
              <Text className="text-white" size="lg">
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
          </Header>
        }
      >
        <main className="container mt-5 px-2 sm:px-0 mx-auto overflow-y-auto">
          <h1>Hello World!</h1>
        </main>
      </AppShell>
    </MantineProvider>
  )
}
