import { LatestPipelineStore } from '$groups/group-tabs/feature-tabs/latest-pipelines/store/latest-pipeline.store'
import { BranchWithLatestPipeline } from '$model/pipeline'
import { filterBy } from '$util/filter-by'
import { Injectable } from '@angular/core'
import { Observable, combineLatest, map } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class BranchFilterService {
  constructor(private store: LatestPipelineStore) {}

  getBranchesWithLatestPipeline(): Observable<BranchWithLatestPipeline[]> {
    return combineLatest([this.store.branchesWithLatestPipeline$, this.store.branchFilterText$]).pipe(
      map(([data, filterText]) => data.filter(({ branch: { name } }) => filterBy(name, filterText)))
    )
  }
}
