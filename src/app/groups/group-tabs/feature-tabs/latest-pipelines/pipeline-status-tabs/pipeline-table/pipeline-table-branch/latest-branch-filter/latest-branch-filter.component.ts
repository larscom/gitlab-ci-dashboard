import { LatestPipelineStore } from '$groups/group-tabs/feature-tabs/latest-pipelines/store/latest-pipeline.store'
import { GroupStore } from '$groups/store/group.store'

import { Component, DestroyRef, effect, inject } from '@angular/core'
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzInputModule } from 'ng-zorro-antd/input'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { debounceTime } from 'rxjs'

@Component({
  selector: 'gcd-latest-branch-filter',
  standalone: true,
  imports: [NzIconModule, NzInputModule, NzButtonModule, NzToolTipModule, ReactiveFormsModule],
  templateUrl: './latest-branch-filter.component.html',
  styleUrls: ['./latest-branch-filter.component.scss']
})
export class LatestBranchFilterComponent {
  private destroyRef = inject(DestroyRef)
  private groupStore = inject(GroupStore)
  private latestPipelineStore = inject(LatestPipelineStore)

  searchControl = new FormControl('')
  value = toSignal(this.searchControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef), debounceTime(100)), {
    initialValue: ''
  })

  constructor() {
    effect(
      () => {
        const groupId = this.groupStore.selectedGroupId()
        if (groupId) {
          this.latestPipelineStore.setBranchFilter(groupId, String(this.value()))
        }
      },
      { allowSignalWrites: true }
    )

    effect(() => {
      const groupId = this.groupStore.selectedGroupId()
      if (groupId) {
        const value = this.latestPipelineStore.getBranchFilter(groupId)()
        this.searchControl.setValue(value, { emitEvent: false })
      }
    })
  }

  resetSearch(): void {
    this.searchControl.setValue('')
  }
}
