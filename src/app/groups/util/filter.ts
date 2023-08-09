import { Project } from '$groups/model/project'

export function filterString(value: string, filterText: string): boolean {
  return value.toLocaleLowerCase().includes(filterText.toLocaleLowerCase())
}

export function filterProject({ name, topics }: Project, filterText: string, filterTopics: string[]): boolean {
  const topicsMatch = filterTopics.length === 0 || filterTopics.every((filter) => topics.includes(filter))
  return topicsMatch && filterString(name, filterText)
}
