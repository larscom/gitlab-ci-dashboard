import { LatestPipelineStore } from '$groups/group-tabs/feature-tabs/latest-pipelines/store/latest-pipeline.store'
import { BranchWithPipeline } from '$groups/model/pipeline'
import { GroupStore } from '$groups/store/group.store'
import { filterNotNull, filterString } from '$groups/util/filter'
import { Injectable } from '@angular/core'
import { Observable, combineLatest, map, switchMap } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class LatestBranchFilterService {
  private selectedGroupId$ = this.groupStore.selectedGroupId$.pipe(filterNotNull)

  constructor(private latestPipelineStore: LatestPipelineStore, private groupStore: GroupStore) {}

  getBranchesWithLatestPipeline(): Observable<BranchWithPipeline[]> {
    return combineLatest([
      this.latestPipelineStore.branchesWithLatestPipeline$,
      this.selectedGroupId$.pipe(switchMap((groupId) => this.latestPipelineStore.branchFilter(groupId)))
    ]).pipe(map(([data, filterText]) => data.filter(({ branch: { name } }) => filterString(name, filterText))))
  }
}
