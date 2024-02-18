import { Branch } from './branch'
import { Project, ProjectId } from './project'
import { Status } from './status'

export interface ProjectWithPipeline {
  project: Project
  pipeline?: Pipeline
}

export interface BranchWithPipeline {
  branch: Branch
  pipeline?: Pipeline
}

export enum Source {
  PUSH = 'push',
  WEB = 'web',
  TRIGGER = 'trigger',
  SCHEDULE = 'schedule',
  API = 'api',
  EXTERNAL = 'external',
  PIPELINE = 'pipeline',
  CHAT = 'chat',
  WEBIDE = 'webide',
  MERGE_REQUEST_EVENT = 'merge_request_event',
  EXTERNAL_PULL_REQUEST_EVENT = 'external_pull_request_event',
  PARENT_PIPELINE = 'parent_pipeline',
  ONDEMAND_DAST_SCAN = 'ondemand_dast_scan',
  ONDEMAND_DAST_VALIDATION = 'ondemand_dast_validation'
}

export type PipelineId = number
export interface Pipeline {
  id: PipelineId
  project_id: ProjectId
  status: Status
  source: Source
  ref: string
  sha: string
  web_url: string
  updated_at: string
  created_at: string
}
