import Empty from '$components/ui/Empty'
import IndeterminateLoader from '$components/ui/IndeterminateLoader'
import { GroupContextProvider } from '$contexts/group-context'
import FeatureTabs from '$feature/feature/FeatureTabs'
import { useGroups } from '$hooks/use-groups'
import { GroupId } from '$models/group'
import { Stack, Tabs, TabsValue, Text } from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import { useEffect } from 'react'

export default function GroupTabs() {
  const { isLoading: loading, data: groups = [] } = useGroups()
  const [groupId, setGroupId] = useLocalStorage<GroupId | undefined>({
    key: 'gcd.group.active'
  })

  useEffect(() => {
    if (!groups.length) return
    if (groups.some(({ id }) => id === groupId)) return

    setGroupId(groups[0].id)
  }, [groups, groupId, setGroupId])

  if (loading) {
    return <IndeterminateLoader />
  }

  if (groups.length === 0) {
    return (
      <Stack align="center">
        <Empty />
        <Text>No groups found...</Text>
      </Stack>
    )
  }

  const tabs = groups.map(({ id, name }) => {
    return (
      <Tabs.Tab key={id} value={String(id)}>
        <Text className="uppercase">{name}</Text>
      </Tabs.Tab>
    )
  })

  const handleChange = (groupId: TabsValue) => setGroupId(Number(groupId))

  return (
    <Tabs value={String(groupId)} onTabChange={handleChange}>
      <Tabs.List>{tabs}</Tabs.List>
      <Tabs.Panel value={String(groupId)} pt="xs">
        <GroupContextProvider value={{ groupId }}>
          <FeatureTabs />
        </GroupContextProvider>
      </Tabs.Panel>
    </Tabs>
  )
}
