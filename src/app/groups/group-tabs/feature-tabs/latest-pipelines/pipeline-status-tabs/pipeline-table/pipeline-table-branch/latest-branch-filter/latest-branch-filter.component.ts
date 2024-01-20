import { LatestPipelineStore } from '$groups/group-tabs/feature-tabs/latest-pipelines/store/latest-pipeline.store'
import { GroupStore } from '$groups/store/group.store'
import { filterNotNull } from '$groups/util/filter'
import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzInputModule } from 'ng-zorro-antd/input'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { debounceTime, switchMap, withLatestFrom } from 'rxjs'

@Component({
  selector: 'gcd-latest-branch-filter',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzInputModule, NzButtonModule, NzToolTipModule, ReactiveFormsModule],
  templateUrl: './latest-branch-filter.component.html',
  styleUrls: ['./latest-branch-filter.component.scss']
})
export class LatestBranchFilterComponent {
  private selectedGroupId$ = this.groupStore.selectedGroupId$.pipe(filterNotNull)

  searchControl = new FormControl('')

  constructor(private latestPipelineStore: LatestPipelineStore, private groupStore: GroupStore) {
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(), debounceTime(100), withLatestFrom(this.selectedGroupId$))
      .subscribe(([value, groupId]) => this.latestPipelineStore.setBranchFilter(groupId, String(value)))

    this.selectedGroupId$
      .pipe(
        switchMap((groupId) => this.latestPipelineStore.branchFilter(groupId)),
        takeUntilDestroyed()
      )
      .subscribe((value) => this.searchControl.setValue(value, { emitEvent: false }))
  }

  resetSearch(): void {
    this.searchControl.setValue('')
  }
}
