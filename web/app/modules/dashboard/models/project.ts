export interface Namespace {
  id: number
  name: string
}

export type ProjectId = number

export interface Project {
  id: ProjectId
  name: string
  description?: string
  default_branch: string
  web_url: string
  namespace: Namespace
}
