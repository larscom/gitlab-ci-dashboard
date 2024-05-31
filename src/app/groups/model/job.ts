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
  name: string
  pipeline: Pipeline
  ref: string
  stage: string
  status: Status
  web_url: string
  user: User
}
