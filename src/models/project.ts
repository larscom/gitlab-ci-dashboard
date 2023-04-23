import { Pipeline } from './pipeline'

export interface Namespace {
  id: number
  name: string
}

export type ProjectId = number

export interface Project {
  id: ProjectId
  name: string
  default_branch: string
  web_url: string
  topics: string[]
  description?: string
  namespace?: Namespace
  latest_pipeline?: Pipeline
}
