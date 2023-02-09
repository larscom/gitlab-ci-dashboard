import { Status } from '$models/pipeline'
import { ProjectWithLatestPipeline } from '$models/project-with-pipeline'
import { CloseSquareOutlined, SearchOutlined } from '@ant-design/icons'
import { ActionIcon, Chip, Group, Input, Tooltip } from '@mantine/core'
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
  useTransition
} from 'react'

const filterBy = (value: string, filterText: string): boolean =>
  value.toLocaleLowerCase().includes(filterText.toLocaleLowerCase())

const filter = (
  data: Map<Status, ProjectWithLatestPipeline[]> | undefined,
  filterText: string,
  filterTopics: string[]
): Map<Status, ProjectWithLatestPipeline[]> => {
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
  }, new Map<Status, ProjectWithLatestPipeline[]>())
}

interface Props {
  unfiltered: Map<Status, ProjectWithLatestPipeline[]> | undefined
  setStatusWithProjects: Dispatch<
    SetStateAction<Map<Status, ProjectWithLatestPipeline[]>>
  >
}
export default function ProjectFilter({
  unfiltered,
  setStatusWithProjects
}: Props) {
  const [, startTransition] = useTransition()
  const [filterTopics, setFilterTopics] = useState<string[]>([])
  const [filterText, setFilterText] = useState<string>('')

  useEffect(() => {
    setStatusWithProjects(unfiltered || new Map())
    setFilterTopics([])
    setFilterText('')
  }, [unfiltered, setStatusWithProjects])

  useEffect(() => {
    setStatusWithProjects(filter(unfiltered, filterText, filterTopics))
  }, [filterText, filterTopics, unfiltered, setStatusWithProjects])

  const handleTextChange = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
      startTransition(() => setFilterText(value)),
    [startTransition, setFilterText]
  )

  const handleChipsChange = useCallback(setFilterTopics, [setFilterTopics])

  const statusWithProjects =
    unfiltered || new Map<Status, ProjectWithLatestPipeline[]>()

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

  const reset = (
    <ActionIcon onClick={() => setFilterText('')} variant="transparent">
      <Tooltip openDelay={250} label="Clear field">
        <CloseSquareOutlined />
      </Tooltip>
    </ActionIcon>
  )

  return (
    <Group>
      <Input
        value={filterText}
        icon={<SearchOutlined />}
        rightSection={reset}
        onChange={handleTextChange}
        placeholder="Search projects..."
      />
      <Chip.Group multiple value={filterTopics} onChange={handleChipsChange}>
        {chips}
      </Chip.Group>
    </Group>
  )
}
