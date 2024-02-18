import { Project } from '$groups/model/project'

import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, effect, input } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzInputModule } from 'ng-zorro-antd/input'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTagModule } from 'ng-zorro-antd/tag'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { debounceTime } from 'rxjs'

@Component({
  selector: 'gcd-project-filter',
  standalone: true,
  imports: [
    NzIconModule,
    NzInputModule,
    NzTagModule,
    NzButtonModule,
    NzToolTipModule,
    NzSpinModule,
    ReactiveFormsModule
  ],
  templateUrl: './project-filter.component.html',
  styleUrls: ['./project-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectFilterComponent {
  projects = input.required<Project[]>()
  selectedFilterText = input.required<string>()

  @Output() filterTextChanged = new EventEmitter<string>()

  projectCount = computed(() => new Set(this.projects().map(({ id }) => id)).size)
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
