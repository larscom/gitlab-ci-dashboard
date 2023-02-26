import SearchField from '$components/SearchField'
import { GroupContext } from '$contexts/group-context'
import { Status } from '$models/pipeline'
import { ProjectPipeline } from '$models/project-pipeline'
import { filterBy } from '$util/filter-by'
import { Chip, Group } from '@mantine/core'
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition
} from 'react'

const filter = (
  data: Map<Status, ProjectPipeline[]> | undefined,
  filterText: string,
  filterTopics: string[]
): Map<Status, ProjectPipeline[]> => {
  if (!data) return new Map()

  return Array.from(data).reduce((current, [status, projects]) => {
    const filteredProjects = projects
      .filter(({ project: { name } }) => filterBy(name, filterText))
      .filter(({ project: { topics } }) => {
        return filterTopics.length
          ? filterTopics
              .map((filter) => topics.includes(filter))
              .every((b) => b)
          : true
      })

    return filteredProjects.length
      ? current.set(status, filteredProjects)
      : current
  }, new Map<Status, ProjectPipeline[]>())
}

interface Props {
  unfiltered: Map<Status, ProjectPipeline[]> | undefined
  setStatusWithProjects: Dispatch<
    SetStateAction<Map<Status, ProjectPipeline[]>>
  >
  disabled?: boolean
}
export default function ProjectFilter({
  unfiltered,
  setStatusWithProjects,
  disabled
}: Props) {
  const [, startTransition] = useTransition()
  const [filterTopics, setFilterTopics] = useState<string[]>([])
  const [filterText, setFilterText] = useState<string>('')
  const { groupId } = useContext(GroupContext)
  const previousGroupId = useRef(groupId)

  useEffect(() => {
    if (groupId !== previousGroupId.current) {
      setFilterText('')
      setFilterTopics([])
    }
    setStatusWithProjects(unfiltered || new Map())
    previousGroupId.current = groupId
  }, [unfiltered, setStatusWithProjects, groupId])

  useEffect(() => {
    startTransition(() => {
      setStatusWithProjects(filter(unfiltered, filterText, filterTopics))
    })
  }, [filterText, filterTopics, unfiltered, setStatusWithProjects])

  const handleTextChange = useCallback<(value: string) => void>(
    (value) => setFilterText(value),
    [setFilterText]
  )

  const handleChipsChange = useCallback(setFilterTopics, [setFilterTopics])

  const statusWithProjects = unfiltered || new Map<Status, ProjectPipeline[]>()

  const topics = new Set(
    Array.from(statusWithProjects.values())
      .flat()
      .flatMap(({ project }) => project.topics)
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
        onChange={handleTextChange}
      />
      <Chip.Group multiple value={filterTopics} onChange={handleChipsChange}>
        {chips}
      </Chip.Group>
    </Group>
  )
}
