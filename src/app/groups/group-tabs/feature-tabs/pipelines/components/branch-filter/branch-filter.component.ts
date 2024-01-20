import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core'

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
  imports: [
    CommonModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzToolTipModule,
    NzSpinModule,
    ReactiveFormsModule
  ],
  templateUrl: './branch-filter.component.html',
  styleUrls: ['./branch-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BranchFilterComponent {
  @Input({ required: true }) selectedFilterText: string = ''
  @Input({ required: true }) branches: string[] = []

  @Output() filterTextChanged = new EventEmitter<string>()

  searchControl = new FormControl('')

  constructor() {
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(), debounceTime(100))
      .subscribe((value) => this.filterTextChanged.next(String(value)))
  }

  ngOnChanges({ selectedFilterText }: SimpleChanges): void {
    if (selectedFilterText) {
      this.searchControl.setValue(this.selectedFilterText, { emitEvent: false })
    }
  }

  get branchCount(): number {
    return new Set(this.branches).size
  }

  resetSearch(): void {
    this.searchControl.setValue('')
  }
}
