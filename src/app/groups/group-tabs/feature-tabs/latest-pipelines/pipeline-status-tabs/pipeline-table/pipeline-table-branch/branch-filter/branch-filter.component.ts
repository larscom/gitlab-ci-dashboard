import { LatestPipelineStore } from '$groups/group-tabs/feature-tabs/latest-pipelines/store/latest-pipeline.store'
import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzInputModule } from 'ng-zorro-antd/input'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { debounceTime } from 'rxjs'

@Component({
  selector: 'gcd-branch-filter',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzInputModule, NzButtonModule, NzToolTipModule, ReactiveFormsModule],
  templateUrl: './branch-filter.component.html',
  styleUrls: ['./branch-filter.component.scss']
})
export class BranchFilterComponent {
  searchControl = new FormControl('')

  constructor(private store: LatestPipelineStore) {
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(), debounceTime(100))
      .subscribe((value) => this.store.setBranchFilterText(String(value)))
    this.store.branchFilterText$
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.searchControl.setValue(value, { emitEvent: false }))
  }

  resetSearch(): void {
    this.searchControl.setValue('')
  }
}
