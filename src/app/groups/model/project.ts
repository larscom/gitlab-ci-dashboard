import { GroupId } from './group'
import { Job } from './job'
import { Pipeline } from './pipeline'

export interface ProjectPipeline {
  group_id: GroupId
  project: Project
  pipeline?: Pipeline
  jobs?: Job[]
}

export interface ProjectPipelines {
  group_id: GroupId
  project: Project
  pipelines: Pipeline[]
}

export interface Namespace {
  id: number
  name: string
  path: string
}

export type ProjectId = number

export interface Project {
  id: ProjectId
  name: string
  default_branch: string
  web_url: string
  topics: string[]
  description?: string
  namespace: Namespace
}
