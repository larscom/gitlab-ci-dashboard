import SearchField from '$components/SearchField'
import { BranchPipeline } from '$models/branch-pipeline'
import { Group } from '@mantine/core'
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
  useTransition
} from 'react'

const filterBy = (value: string, filterText: string): boolean =>
  value.toLocaleLowerCase().includes(filterText.toLocaleLowerCase())

interface Props {
  unfiltered: BranchPipeline[]
  setBranchPipelines: Dispatch<SetStateAction<BranchPipeline[]>>
}
export default function BranchFilter({
  unfiltered,
  setBranchPipelines
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
    [setFilterText]
  )

  return (
    <Group>
      <SearchField
        placeholder="Search branches"
        value={filterText}
        onChange={handleTextChange}
      />
    </Group>
  )
}
