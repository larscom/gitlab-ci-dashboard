export interface Namespace {
  id: number
  name: string
}

export type ProjectId = number

export interface Project {
  id: ProjectId
  name: string
  description?: string
  defaultBranch: string
  webUrl: string
  namespace: Namespace
  topics: string[]
}
