import { GroupId } from '$groups/model/group'
import { BranchLatestPipeline, ProjectLatestPipeline } from '$groups/model/pipeline'
import { ProjectId } from '$groups/model/project'
import { UIStore } from '$store/ui.store'
import { computed, inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { lastValueFrom } from 'rxjs'
import { LatestPipelineService } from '../service/latest-pipeline.service'

interface State {
  selectedProjectId: ProjectId | undefined
  projectsLatestPipelines: ProjectLatestPipeline[]
  projectsLoading: boolean
  branchesLatestPipelines: BranchLatestPipeline[]
  branchesLoading: boolean

  filters: {
    [groupId: GroupId]: {
      project: string
      topics: string[]
      branch: string
    }
  }
}

export const LatestPipelineStore = signalStore(
  { providedIn: 'root' },
  withState<State>({
    selectedProjectId: undefined,
    projectsLatestPipelines: [],
    projectsLoading: false,
    branchesLatestPipelines: [],
    branchesLoading: false,
    filters: Object()
  }),
  withMethods((store, service = inject(LatestPipelineService), uiStore = inject(UIStore)) => ({
    getProjectFilter(groupId: GroupId) {
      return computed(() => {
        const filters = store.filters()
        return filters[groupId]?.project || ''
      })
    },
    getBranchFilter(groupId: GroupId) {
      return computed(() => {
        const filters = store.filters()
        return filters[groupId]?.branch || ''
      })
    },
    getTopicsFilter(groupId: GroupId) {
      return computed(() => {
        const filters = store.filters()
        return filters[groupId]?.topics || []
      })
    },
    async fetchProjects(groupId: GroupId, withLoading: boolean = true) {
      uiStore.setAutoRefreshLoading(groupId, !withLoading)
      patchState(store, { projectsLoading: withLoading })

      const projectsLatestPipelines = await lastValueFrom(service.getProjectsWithLatestPipeline(groupId))
      patchState(store, { projectsLatestPipelines, projectsLoading: false })

      uiStore.setAutoRefreshLoading(groupId, false)
    },
    async fetchBranches(projectId: ProjectId, withLoading: boolean = true) {
      uiStore.setAutoRefreshLoading(projectId, !withLoading)
      patchState(store, { branchesLoading: withLoading })

      const branchesLatestPipelines = await lastValueFrom(service.getBranchesWithLatestPipeline(projectId))

      patchState(store, { branchesLatestPipelines, branchesLoading: false })
      uiStore.setAutoRefreshLoading(projectId, false)
    },
    selectProjectId(projectId: ProjectId | undefined) {
      patchState(store, { selectedProjectId: projectId })
    },
    setProjectFilter(groupId: GroupId, project: string) {
      patchState(store, (state) => {
        return {
          filters: {
            ...state.filters,
            [groupId]: {
              ...state.filters[groupId],
              project
            }
          }
        }
      })
    },
    setBranchFilter(groupId: GroupId, branch: string) {
      patchState(store, (state) => {
        return {
          filters: {
            ...state.filters,
            [groupId]: {
              ...state.filters[groupId],
              branch
            }
          }
        }
      })
    },
    setTopicsFilter(groupId: GroupId, topics: string[]) {
      patchState(store, (state) => {
        return {
          filters: {
            ...state.filters,
            [groupId]: {
              ...state.filters[groupId],
              topics
            }
          }
        }
      })
    }
  }))
)
