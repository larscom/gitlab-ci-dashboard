import SearchField from '$components/SearchField'
import { GroupId } from '$models/group'
import { ProjectPipeline } from '$models/project-pipeline'
import { Chip, Group } from '@mantine/core'
import { Dispatch, SetStateAction, useEffect, useRef } from 'react'

interface Props {
  projects: ProjectPipeline[]
  disabled?: boolean
  filterText: string
  filterTopics: string[]
  groupId: GroupId
  setFilterText: Dispatch<SetStateAction<string>>
  setFilterTopics: Dispatch<SetStateAction<string[]>>
}
export default function ProjectFilter({
  projects,
  disabled,
  filterText,
  filterTopics,
  groupId,
  setFilterText,
  setFilterTopics
}: Props) {
  const groupIdRef = useRef(groupId)

  useEffect(() => {
    if (groupId !== groupIdRef.current) {
      setFilterText('')
      setFilterTopics([])
    }
    groupIdRef.current = groupId
  }, [groupId, setFilterText, setFilterTopics])

  const topics = new Set(Array.from(projects).flatMap(({ project }) => project.topics))

  const chips = Array.from(topics)
    .sort((a, b) => a.localeCompare(b))
    .map((topic) => (
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
