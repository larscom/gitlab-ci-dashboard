import { CloseSquareOutlined, SearchOutlined } from '@ant-design/icons'
import { ActionIcon, Input, Tooltip } from '@mantine/core'
import { ChangeEvent, useCallback } from 'react'

interface Props {
  placeholder?: string
  value: string
  onChange: (value: string) => void
}
export default function SearchField({ placeholder, value, onChange }: Props) {
  const handleTextChange = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) => onChange(value),
    [onChange]
  )

  const reset = (
    <ActionIcon onClick={() => onChange('')} variant="transparent">
      <Tooltip openDelay={250} label="Clear field">
        <CloseSquareOutlined />
      </Tooltip>
    </ActionIcon>
  )

  return (
    <Input
      value={value}
      icon={<SearchOutlined />}
      rightSection={reset}
      onChange={handleTextChange}
      placeholder={placeholder}
    />
  )
}
