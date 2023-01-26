import { AppShell, MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from 'react-query'
import GroupTabs from './feature/group/GroupTabs'
import Header from './components/Header'

const queryClient = new QueryClient()

export default function App() {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <AppShell fixed header={<Header />}>
        <QueryClientProvider client={queryClient}>
          <div className="container mt-5 px-2 sm:px-0 mx-auto overflow-y-auto">
            <GroupTabs />
          </div>
        </QueryClientProvider>
      </AppShell>
    </MantineProvider>
  )
}
