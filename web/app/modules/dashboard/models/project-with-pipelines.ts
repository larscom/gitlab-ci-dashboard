import { Pipeline } from './pipeline'
import { Project } from './project'

export interface ProjectWithPipelines {
  project: Project
  pipelines: Pipeline[]
}
