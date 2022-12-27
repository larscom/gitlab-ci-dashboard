import { SearchOutlined } from '@ant-design/icons'
import { Chip, Group, Input } from '@mantine/core'
import { useCallback, useContext, useTransition } from 'react'
import { ProjectContext } from '../contexts/project-context'

interface Props {
  onFilterTextChange: (filterText: string) => void
  onTopicFilterChange: (topics: string[]) => void
}
export default function ProjectFilter({
  onFilterTextChange,
  onTopicFilterChange,
}: Props) {
  const { statusWithProjects } = useContext(ProjectContext)
  const startTransition = useTransition()[1]

  const handleFilterText = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) =>
      startTransition(() => onFilterTextChange(value)),
    [startTransition, onFilterTextChange]
  )

  const handleTopicFilter = useCallback(onTopicFilterChange, [
    onTopicFilterChange,
  ])

  const topics = new Set(
    Array.from(statusWithProjects.values())
      .flat()
      .flatMap(({ project }) => project.topics)
  )

  const chips = Array.from(topics).map((topic) => (
    <Chip key={topic} value={topic}>
      {topic}
    </Chip>
  ))

  return (
    <Group>
      <Input
        icon={<SearchOutlined />}
        onChange={handleFilterText}
        placeholder="Search projects..."
      />
      <Chip.Group multiple onChange={handleTopicFilter}>
        {chips}
      </Chip.Group>
    </Group>
  )
}
