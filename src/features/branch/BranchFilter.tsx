import SearchField from '$components/SearchField'
import { BranchPipeline } from '$models/branch-pipeline'
import { filterBy } from '$util/filter-by'
import { Group } from '@mantine/core'
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
  useTransition
} from 'react'

interface Props {
  unfiltered: BranchPipeline[]
  setBranchPipelines: Dispatch<SetStateAction<BranchPipeline[]>>
  disabled?: boolean
}
export default function BranchFilter({
  unfiltered,
  setBranchPipelines,
  disabled
}: Props) {
  const [, startTransition] = useTransition()
  const [filterText, setFilterText] = useState<string>('')

  useEffect(() => {
    setBranchPipelines(unfiltered)
    setFilterText('')
  }, [unfiltered, setBranchPipelines])

  useEffect(() => {
    startTransition(() => {
      setBranchPipelines(
        unfiltered.filter(({ branch }) => filterBy(branch.name, filterText))
      )
    })
  }, [filterText, unfiltered, setBranchPipelines])

  const handleTextChange = useCallback<(value: string) => void>(
    (value) => setFilterText(value),
    []
  )

  return (
    <Group>
      <SearchField
        placeholder="Search branches"
        disabled={disabled}
        value={filterText}
        onChange={handleTextChange}
      />
    </Group>
  )
}
