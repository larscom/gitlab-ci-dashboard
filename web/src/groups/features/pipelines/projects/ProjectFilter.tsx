import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { ActionIcon, Chip, Group, Input, Tooltip } from '@mantine/core'
import { useCallback, useContext, useState, useTransition } from 'react'
import { ProjectContext } from '../contexts/project-context'

interface Props {
  onFilterTextChange: (filterText: string) => void
  onTopicFilterChange: (filterTopics: string[]) => void
}
export default function ProjectFilter({
  onFilterTextChange,
  onTopicFilterChange,
}: Props) {
  const { statusWithProjects } = useContext(ProjectContext)
  const [, startTransition] = useTransition()
  const [filterTopics, setFilterTopics] = useState<string[]>([])
  const [filterText, setFilterText] = useState<string>('')

  const handleTextChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) =>
      startTransition(() => {
        setFilterText(value)
        onFilterTextChange(value)
      }),
    [startTransition, onFilterTextChange]
  )

  const handleChipsChange = useCallback(
    (topics: string[]) => {
      setFilterTopics(topics)
      onTopicFilterChange(topics)
    },
    [onTopicFilterChange, setFilterTopics]
  )

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
    <ActionIcon
      onClick={() => {
        setFilterText('')
        onFilterTextChange('')
      }}
      variant="transparent"
    >
      <Tooltip openDelay={250} label="Clear field">
        <ReloadOutlined />
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
