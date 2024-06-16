import { GroupId } from './group'
import { Pipeline } from './pipeline'
import { Project } from './project'
import { User } from './user'

export interface ScheduleProjectPipeline {
  group_id: GroupId
  schedule: Schedule
  project: Project
  pipeline?: Pipeline
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
  owner: User
}
