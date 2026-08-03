import { GroupId } from './group'

export interface RunnerJobPipeline {
  id: number
  project_id: number
  ref: string
}

export interface RunnerJob {
  id: number
  name: string
  stage: string
  status: string
  ref: string
  web_url: string
  pipeline: RunnerJobPipeline
  started_at?: string
  duration?: number
}

export interface Runner {
  id: number
  description: string
  paused: boolean
  is_shared: boolean
  online?: boolean
  runner_type: string
  status: string
  job_execution_status: string
  tag_list: string[]
  ip_address: string
  projects: { id: number; name: string; path_with_namespace: string }[]
  scope_name: string
  contacted_at?: string
}

export interface RunnerWithJobs {
  group_id: GroupId
  runner: Runner
  jobs: RunnerJob[]
}
