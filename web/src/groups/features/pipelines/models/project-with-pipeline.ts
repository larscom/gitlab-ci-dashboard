import { Project } from '$groups/models/project'
import { Pipeline } from './pipeline'

export interface ProjectWithLatestPipeline {
  project: Project
  pipeline?: Pipeline
}
