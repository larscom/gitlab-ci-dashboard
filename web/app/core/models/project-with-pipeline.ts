import { Pipeline } from './pipeline'
import { Project } from './project'

export interface ProjectWithLatestPipeline {
  project: Project
  pipeline?: Pipeline
}
