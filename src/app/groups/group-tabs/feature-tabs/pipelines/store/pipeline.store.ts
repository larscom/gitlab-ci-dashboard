import { GroupId } from '$groups/model/group'
import { PipelineId, ProjectPipelines } from '$groups/model/pipeline'
import { Status } from '$groups/model/status'
import { computed, inject } from '@angular/core'

import { UIStore } from '$store/ui.store'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { lastValueFrom } from 'rxjs'
import { PipelineService } from '../service/pipeline.service'

interface State {
  projectPipelines: ProjectPipelines[]
  loading: boolean
  filters: {
    [groupId: GroupId]: {
      project: string
      branch: string
      topics: string[]
      statuses: Status[]
      pinnedPipelines: PipelineId[]
    }
  }
}

export const PipelineStore = signalStore(
  { providedIn: 'root' },
  withState<State>({
    projectPipelines: [],
    filters: Object(),
    loading: false
  }),
  withMethods((store, service = inject(PipelineService), uiStore = inject(UIStore)) => ({
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
    getStatusesFilter(groupId: GroupId) {
      return computed(() => {
        const filters = store.filters()
        return filters[groupId]?.statuses || []
      })
    },
    getPinnedPipelines(groupId: GroupId) {
      return computed(() => {
        const filters = store.filters()
        return filters[groupId]?.pinnedPipelines || []
      })
    },
    async fetch(groupId: GroupId, withLoading: boolean = true) {
      uiStore.setAutoRefreshLoading(groupId, !withLoading)
      patchState(store, { loading: withLoading })

      const projectPipelines = await lastValueFrom(service.getProjectsWithPipeline(groupId))

      patchState(store, { projectPipelines, loading: false })
      uiStore.setAutoRefreshLoading(groupId, false)
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
    },
    setStatusesFilter(groupId: GroupId, statuses: Status[]) {
      patchState(store, (state) => {
        return {
          filters: {
            ...state.filters,
            [groupId]: {
              ...state.filters[groupId],
              statuses
            }
          }
        }
      })
    },
    setPinnedPipelines(groupId: GroupId, pinnedPipelines: PipelineId[]) {
      patchState(store, (state) => {
        return {
          filters: {
            ...state.filters,
            [groupId]: {
              ...state.filters[groupId],
              pinnedPipelines
            }
          }
        }
      })
    }
  }))
)
