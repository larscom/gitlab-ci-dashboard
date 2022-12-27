import { Status } from '$groups/features/pipelines/models/pipeline'
import { ProjectWithLatestPipeline } from '$groups/features/pipelines/models/project-with-pipeline'
import { createContext } from 'react'

interface ProjectContext {
  statusWithProjects: Map<Status, ProjectWithLatestPipeline[]>
}

export const ProjectContext = createContext<ProjectContext>({
  statusWithProjects: new Map(),
})

export const ProjectContextProvider = ProjectContext.Provider
