import SearchField from '$components/SearchField'
import { GroupContext } from '$contexts/group-context'
import { ProjectPipeline } from '$models/project-pipeline'
import { Chip, Group } from '@mantine/core'
import { Dispatch, SetStateAction, useContext, useEffect, useRef } from 'react'

interface Props {
  unfiltered: ProjectPipeline[]
  filterText: string
  setFilterText: Dispatch<SetStateAction<string>>
  filterTopics: string[]
  setFilterTopics: Dispatch<SetStateAction<string[]>>
  disabled?: boolean
}
export default function ProjectFilter({
  unfiltered,
  setFilterText,
  filterText,
  filterTopics,
  setFilterTopics,
  disabled
}: Props) {
  const { groupId } = useContext(GroupContext)
  const previousGroupId = useRef(groupId)

  useEffect(() => {
    if (groupId !== previousGroupId.current) {
      setFilterText('')
      setFilterTopics([])
    }
    previousGroupId.current = groupId
  }, [groupId, setFilterText, setFilterTopics])

  const topics = new Set(
    Array.from(unfiltered).flatMap(({ project }) => project.topics)
  )

  const chips = Array.from(topics).map((topic) => (
    <Chip color="teal" key={topic} value={topic}>
      <span className="lowercase">{topic}</span>
    </Chip>
  ))

  return (
    <Group>
      <SearchField
        placeholder="Search projects"
        disabled={disabled}
        value={filterText}
        onChange={setFilterText}
      />
      <Chip.Group multiple value={filterTopics} onChange={setFilterTopics}>
        {chips}
      </Chip.Group>
    </Group>
  )
}
