import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, effect, input } from '@angular/core'

import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzInputModule } from 'ng-zorro-antd/input'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { debounceTime } from 'rxjs'

@Component({
  selector: 'gcd-branch-filter',
  standalone: true,
  imports: [NzIconModule, NzInputModule, NzButtonModule, NzToolTipModule, NzSpinModule, ReactiveFormsModule],
  templateUrl: './branch-filter.component.html',
  styleUrls: ['./branch-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BranchFilterComponent {
  branches = input.required<string[]>()
  selectedFilterText = input.required<string>()

  @Output() filterTextChanged = new EventEmitter<string>()

  branchCount = computed(() => new Set(this.branches()).size)
  searchControl = new FormControl('')

  constructor() {
    effect(() => {
      this.searchControl.setValue(this.selectedFilterText(), { emitEvent: false })
    })

    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(), debounceTime(100))
      .subscribe((value) => this.filterTextChanged.next(String(value)))
  }

  resetSearch(): void {
    this.searchControl.setValue('')
  }
}
