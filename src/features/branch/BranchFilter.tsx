import SearchField from '$components/SearchField'
import { Group } from '@mantine/core'
import { Dispatch, SetStateAction } from 'react'

interface Props {
  filterText: string
  setFilterText: Dispatch<SetStateAction<string>>
  disabled?: boolean
}
export default function BranchFilter({ filterText, setFilterText, disabled }: Props) {
  return (
    <Group>
      <SearchField
        placeholder="Search branches"
        disabled={disabled}
        value={filterText}
        onChange={setFilterText}
      />
    </Group>
  )
}
