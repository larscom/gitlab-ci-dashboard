import { AppShell, MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from 'react-query'
import GroupTabs from './components/GroupTabs'
import TopBar from './components/header/TopBar'

export default function App() {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <AppShell fixed header={<TopBar />}>
        <div className="container mt-5 px-2 sm:px-0 mx-auto overflow-y-auto">
          <QueryClientProvider client={new QueryClient()}>
            <GroupTabs />
          </QueryClientProvider>
        </div>
      </AppShell>
    </MantineProvider>
  )
}
