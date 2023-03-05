import { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'

export function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  })

  // eslint-disable-next-line
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
