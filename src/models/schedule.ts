import { Status } from './pipeline'
import { Project } from './project'

export interface Owner {
  id: number
  username: string
  name: string
  state: string
  is_admin: boolean
}

export type ScheduleId = number
export interface Schedule {
  id: ScheduleId
  description: string
  ref: string
  cron: string
  cron_timezone: string
  next_run_at: string
  active: boolean
  created_at: string
  updated_at: string
  owner: Owner
  project: Project
  pipeline_status: Status
}
