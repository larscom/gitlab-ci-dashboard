import { Status } from '$groups/features/pipelines/models/pipeline'
import { ProjectWithLatestPipeline } from '$groups/features/pipelines/models/project-with-pipeline'
import { createContext } from 'react'

interface ProjectContext {
  statusWithProjects: Map<Status, ProjectWithLatestPipeline[]>
  filterText: string
  filterTopics: string[]
}

export const ProjectContext = createContext<ProjectContext>({
  statusWithProjects: new Map(),
  filterText: '',
  filterTopics: [],
})

export const ProjectContextProvider = ProjectContext.Provider
