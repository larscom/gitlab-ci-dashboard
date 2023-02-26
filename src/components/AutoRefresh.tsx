import { Checkbox } from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import { useEffect } from 'react'
import { QueryObserverBaseResult } from 'react-query'

const REFETCH_INTERVAL = 5_000

interface Props {
  refetch: QueryObserverBaseResult['refetch']
  disabled?: boolean
}
export default function AutoRefresh({ refetch, disabled }: Props) {
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
    <Checkbox
      checked={checked}
      disabled={disabled}
      onChange={({ currentTarget }) => setChecked(currentTarget.checked)}
      labelPosition="left"
      label="Auto Refresh (5s)"
    />
  )
}
