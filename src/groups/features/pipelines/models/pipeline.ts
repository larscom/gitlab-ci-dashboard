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

export const Status = {
  CREATED: 'created' as Status,
  WAITING_FOR_RESOURCE: 'waiting_for_resource' as Status,
  PREPARING: 'preparing' as Status,
  RUNNING: 'running' as Status,
  SUCCESS: 'success' as Status,
  FAILED: 'failed' as Status,
  CANCELED: 'canceled' as Status,
  SKIPPED: 'skipped' as Status,
  MANUAL: 'manual' as Status,
  SCHEDULED: 'scheduled' as Status,
  UNKNOWN: 'unknown' as Status,
} as const

export interface Pipeline {
  id: number
  projectId: number
  status: Status
  source: Source
  ref: string
  sha: string
  webUrl: string
  updatedAt: string
  createdAt: string
}
