import { Pipeline, Status } from '$groups/model/pipeline'
import { Project } from '$groups/model/project'
import { Observable, filter } from 'rxjs'

export function filterString(value: string, filterText: string): boolean {
  return value.toLocaleLowerCase().includes(filterText.toLocaleLowerCase())
}

export function filterProject({ name, topics }: Project, filterText: string, filterTopics: string[]): boolean {
  const topicsMatch = filterTopics.length === 0 || filterTopics.every((filter) => topics.includes(filter))
  return topicsMatch && filterString(name, filterText)
}

export function filterPipeline({ status }: Pipeline, filterStatuses: Status[]): boolean {
  return filterStatuses.length === 0 || filterStatuses.some((filter) => status.includes(filter))
}

export function filterNotNull<T>(source: Observable<T | null | undefined>): Observable<T> {
  return source.pipe(filter((value): value is T => value != null))
}
