import { Stack, Tabs, TabsValue, Text } from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import { useGroups } from '../hooks/use-groups'
import { GroupId } from '../models/group'
import FeatureTabs from './FeatureTabs'
import Empty from './ui/Empty'
import Loader from './ui/Loader'

export default function GroupTabs() {
  const { isLoading: loading, data: groups = [] } = useGroups()
  const [groupId, setGroupId] = useLocalStorage<GroupId>({
    key: 'gcd.group.active',
    defaultValue: 0,
  })

  if (loading) {
    return <Loader />
  }

  if (groups.length === 0) {
    return (
      <Stack align="center">
        <Empty />
        <Text>No groups found...</Text>
      </Stack>
    )
  }

  if (!groupId) {
    setGroupId(groups[0].id)
  }

  const tabs = groups.map(({ id, name }) => {
    return (
      <Tabs.Tab key={id} value={String(id)}>
        {name.toUpperCase()}
      </Tabs.Tab>
    )
  })

  const handleChange = (groupId: TabsValue) => setGroupId(Number(groupId))

  return (
    <Tabs value={String(groupId)} onTabChange={handleChange}>
      <Tabs.List>{tabs}</Tabs.List>
      <Tabs.Panel value={String(groupId)} pt="xs">
        <FeatureTabs groupId={groupId} />
      </Tabs.Panel>
    </Tabs>
  )
}
