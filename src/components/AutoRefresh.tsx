import { ReloadOutlined } from '@ant-design/icons'
import {
  ActionIcon,
  Group,
  Loader,
  MantineColor,
  NativeSelect,
  Tooltip
} from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import { useEffect } from 'react'
import { QueryObserverBaseResult } from 'react-query'

interface Props {
  refetch: QueryObserverBaseResult['refetch']
  id: string
  loading?: boolean
  loadingColor?: MantineColor
  disabled?: boolean
}

export default function AutoRefresh({
  id,
  refetch,
  disabled,
  loading,
  loadingColor
}: Props) {
  const [refreshInterval, setRefreshInterval] = useLocalStorage<string>({
    key: `gcd.${id}.refresh-interval`,
    defaultValue: ''
  })

  useEffect(() => {
    if (refreshInterval === '') return

    const i = setInterval(
      () => !disabled && refetch(),
      Number(refreshInterval) * 1000
    )
    return () => clearInterval(i)
  }, [refreshInterval, refetch, disabled])

  return (
    <Group spacing="xs">
      {loading && <Loader color={loadingColor} size="xs" />}
      <Group spacing="xs">
        <ActionIcon
          disabled={disabled}
          onClick={() => refetch()}
          variant="transparent"
        >
          <Tooltip openDelay={250} label="Refresh now">
            <ReloadOutlined />
          </Tooltip>
        </ActionIcon>
        <NativeSelect
          value={refreshInterval}
          disabled={disabled}
          onChange={({ currentTarget }) =>
            setRefreshInterval(currentTarget.value)
          }
          data={[
            { label: 'off', value: '' },
            { label: '5s', value: '5' },
            { label: '10s', value: '10' },
            { label: '30s', value: '30' },
            { label: '60s', value: '60' }
          ]}
        />
      </Group>
    </Group>
  )
}
