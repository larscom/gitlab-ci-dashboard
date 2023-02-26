import { Checkbox, Group, Loader } from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import { useEffect } from 'react'
import { QueryObserverBaseResult } from 'react-query'

const REFETCH_INTERVAL = 5_000

interface Props {
  refetch: QueryObserverBaseResult['refetch']
  loading?: boolean
  disabled?: boolean
}
export default function AutoRefresh({ refetch, disabled, loading }: Props) {
  const [checked, setChecked] = useLocalStorage<boolean>({
    key: `gcd.project.auto-refresh`,
    defaultValue: false
  })

  useEffect(() => {
    const i = setInterval(
      () => !disabled && checked && refetch(),
      REFETCH_INTERVAL
    )
    return () => clearInterval(i)
  }, [refetch, checked, disabled])

  return (
    <Group spacing="xs">
      {loading && <Loader color="pink" size="xs" />}
      <Checkbox
        checked={checked}
        disabled={disabled}
        onChange={({ currentTarget }) => setChecked(currentTarget.checked)}
        labelPosition="left"
        label="Auto Refresh (5s)"
      />
    </Group>
  )
}
