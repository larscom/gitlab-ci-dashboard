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

export enum Status {
  CREATED = 'created',
  WAITING_FOR_RESOURCE = 'waiting_for_resource',
  PREPARING = 'preparing',
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELED = 'canceled',
  SKIPPED = 'skipped',
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  UNKNOWN = 'unknown'
}

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
