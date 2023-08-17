import { UIStore } from '$store/ui.store'
import { Injectable } from '@angular/core'
import { createEffect, ofType } from '@ngneat/effects'
import { of, switchMap, tap, zip } from 'rxjs'
import { LatestPipelineService } from '../service/latest-pipeline.service'
import { fetchBranchesWithLatestPipeline, fetchProjectsWithLatestPipeline } from './latest-pipeline.actions'
import { LatestPipelineStore } from './latest-pipeline.store'

@Injectable({ providedIn: 'root' })
export class LatestPipelineEffects {
  fetchProjectsWithLatestPipeline = createEffect((actions) => {
    return actions.pipe(
      ofType(fetchProjectsWithLatestPipeline),
      tap(({ groupId, withLoader }) => this.uiStore.setAutoRefreshLoading(groupId, !withLoader)),
      switchMap(({ groupId, withLoader }) =>
        zip(of(groupId), this.service.getProjectsWithLatestPipeline(groupId, withLoader))
      ),
      tap(([_, projects]) => this.latestPipelineStore.setProjectsWithLatestPipeline(projects)),
      tap(([groupId]) => this.uiStore.setAutoRefreshLoading(groupId, false))
    )
  })

  fetchBranchesWithLatestPipeline = createEffect((actions) => {
    return actions.pipe(
      ofType(fetchBranchesWithLatestPipeline),
      tap(({ projectId, withLoader }) => this.uiStore.setAutoRefreshLoading(projectId, !withLoader)),
      switchMap(({ projectId, withLoader }) =>
        zip(of(projectId), this.service.getBranchesWithLatestPipeline(projectId, withLoader))
      ),
      tap(([_, branches]) => this.latestPipelineStore.setBranchesWithLatestPipeline(branches)),
      tap(([projectId]) => this.uiStore.setAutoRefreshLoading(projectId, false))
    )
  })

  constructor(
    private latestPipelineStore: LatestPipelineStore,
    private service: LatestPipelineService,
    private uiStore: UIStore
  ) {}
}
