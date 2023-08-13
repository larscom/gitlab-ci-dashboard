import { UIStore } from '$store/ui.store'
import { Injectable } from '@angular/core'
import { createEffect, ofType } from '@ngneat/effects'
import { of, switchMap, tap, zip } from 'rxjs'
import { PipelineService } from '../service/pipeline.service'
import { fetchProjectsWithPipeline, resetAllFilters } from './pipeline.actions'
import { PipelineStore } from './pipeline.store'

@Injectable({ providedIn: 'root' })
export class PipelineEffects {
  fetchProjectsWithPipeline = createEffect((actions) => {
    return actions.pipe(
      ofType(fetchProjectsWithPipeline),
      tap(({ groupId, withLoader }) => this.uiStore.setAutoRefreshLoading(groupId, !withLoader)),
      switchMap(({ groupId, withLoader }) =>
        zip(of(groupId), this.service.getProjectsWithPipeline(groupId, withLoader))
      ),
      tap(([_, projects]) => this.pipelineStore.setProjectsWithPipeline(projects)),
      tap(([groupId]) => this.uiStore.setAutoRefreshLoading(groupId, false))
    )
  })

  resetAllFilters = createEffect((actions) => {
    return actions.pipe(
      ofType(resetAllFilters),
      tap(() => {
        this.pipelineStore.setProjectFilterText('')
        this.pipelineStore.setProjectFilterTopics([])
      })
    )
  })

  constructor(private pipelineStore: PipelineStore, private service: PipelineService, private uiStore: UIStore) {}
}
