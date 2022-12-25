import { createContext, Dispatch, SetStateAction } from 'react'

interface ProjectContext {
  filterText: string
  filterTopics: string[]
  setFilterText: Dispatch<SetStateAction<string>>
  setFilterTopics: Dispatch<SetStateAction<string[]>>
}

export const ProjectContext = createContext<ProjectContext>({
  filterText: '',
  filterTopics: [],
  setFilterText: () => void 0,
  setFilterTopics: () => void 0,
})

export const ProjectContextProvider = ProjectContext.Provider
