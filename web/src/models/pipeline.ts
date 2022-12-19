export type Source =
  | 'push'
  | 'web'
  | 'trigger'
  | 'schedule'
  | 'api'
  | 'external'
  | 'pipeline'
  | 'chat'
  | 'webide'
  | 'merge_request_event'
  | 'external_pull_request_event'
  | 'parent_pipeline'
  | 'ondemand_dast_scan'
  | 'ondemand_dast_validation'

export type Status =
  | 'created'
  | 'waiting_for_resource'
  | 'preparing'
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'canceled'
  | 'skipped'
  | 'manual'
  | 'scheduled'
  | 'unknown'

export interface Pipeline {
  id: number
  project_id: number
  status: Status
  source: Source
  ref: string
  sha: string
  web_url: string
  updated_at: string
  created_at: string
}
