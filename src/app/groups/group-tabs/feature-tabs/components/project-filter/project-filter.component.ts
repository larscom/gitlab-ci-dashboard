import { Project } from '$groups/model/project'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal
} from '@angular/core'
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
    CommonModule,
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
export class ProjectFilterComponent implements OnChanges {
  @Input({ required: true }) projects: Project[] = []
  @Input({ required: true }) selectedFilterText: string = ''
  @Input({ required: true }) selectedFilterTopics: string[] = []
  @Input() loading = false

  @Output() filterTopicsChanged = new EventEmitter<string[]>()
  @Output() filterTextChanged = new EventEmitter<string>()

  topics = signal(new Set<string>())
  searchControl = new FormControl('')

  constructor() {
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(), debounceTime(100))
      .subscribe((value) => this.filterTextChanged.next(String(value)))
  }

  ngOnChanges({ projects, selectedFilterText }: SimpleChanges): void {
    if (projects) {
      this.topics.set(new Set(this.projects.flatMap(({ topics }) => topics).sort((a, b) => a.localeCompare(b))))
    }
    if (selectedFilterText) {
      this.searchControl.setValue(this.selectedFilterText, { emitEvent: false })
    }
  }

  get projectCount(): number {
    return new Set(this.projects.map(({ id }) => id)).size
  }

  onTopicChange(checked: boolean, topic: string): void {
    const selected = this.selectedFilterTopics
    if (checked) {
      this.filterTopicsChanged.next([...selected, topic])
    } else {
      this.filterTopicsChanged.next(selected.filter((t) => t !== topic))
    }
  }

  resetSearch(): void {
    this.searchControl.setValue('')
  }
}
