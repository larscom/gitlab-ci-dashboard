import { Commit } from './branch'
import { Pipeline } from './pipeline'
import { Status } from './status'
import { User } from './user'

export type JobId = number
export interface Job {
  id: JobId
  commit: Commit
  allow_failure: boolean
  created_at: string
  started_at: string
  finished_at: string
  duration: number
  queued_duration: number
  artifacts_expire_at: string
  name: string
  pipeline: Pipeline
  ref: string
  stage: string
  status: Status
  failure_reason: string
  tag: boolean
  web_url: string
  user: User
}
