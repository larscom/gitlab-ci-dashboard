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
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTagModule } from 'ng-zorro-antd/tag'

@Component({
  selector: 'gcd-topic-filter',
  standalone: true,
  imports: [CommonModule, NzTagModule, NzSpinModule],
  templateUrl: './topic-filter.component.html',
  styleUrls: ['./topic-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopicFilterComponent implements OnChanges {
  @Input({ required: true }) projects: Project[] = []
  @Input({ required: true }) selectedFilterTopics: string[] = []
  @Input() loading = false

  @Output() filterTopicsChanged = new EventEmitter<string[]>()

  topics = signal(new Set<string>())

  ngOnChanges({ projects }: SimpleChanges): void {
    if (projects) {
      this.topics.set(new Set(this.projects.flatMap(({ topics }) => topics).sort((a, b) => a.localeCompare(b))))
    }
  }

  onTopicChange(checked: boolean, topic: string): void {
    const selected = this.selectedFilterTopics
    if (checked) {
      this.filterTopicsChanged.next([...selected, topic])
    } else {
      this.filterTopicsChanged.next(selected.filter((t) => t !== topic))
    }
  }
}
