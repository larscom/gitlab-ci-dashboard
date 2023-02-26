import { Pipeline } from './pipeline'
import { Project } from './project'

export interface ProjectPipeline {
  project: Project
  pipeline?: Pipeline
}
