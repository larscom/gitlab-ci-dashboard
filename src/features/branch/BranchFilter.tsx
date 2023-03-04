import SearchField from '$components/SearchField'
import { BranchPipeline } from '$models/branch-pipeline'
import { filterBy } from '$util/filter-by'
import { Group } from '@mantine/core'
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
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

  const filtered = useMemo(
    () => unfiltered.filter(({ branch }) => filterBy(branch.name, filterText)),
    [unfiltered, filterText]
  )

  useEffect(
    () => startTransition(() => setBranchPipelines(filtered)),
    [filtered, setBranchPipelines]
  )

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
