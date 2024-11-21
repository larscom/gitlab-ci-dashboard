import { Project } from '$groups/model/project'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Signal, computed, input, model } from '@angular/core'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTagModule } from 'ng-zorro-antd/tag'

@Component({
  selector: 'gcd-topic-filter',
  imports: [CommonModule, NzTagModule, NzSpinModule],
  templateUrl: './topic-filter.component.html',
  styleUrls: ['./topic-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopicFilterComponent {
  projects = input.required<Project[]>()
  loading = input(false)

  filterTopics = model.required<string[]>()

  topics: Signal<Set<string>> = computed(
    () =>
      new Set(
        this.projects()
          .flatMap(({ topics }) => topics)
          .sort((a, b) => a.localeCompare(b))
      )
  )

  onTopicChange(checked: boolean, topic: string): void {
    const selected = this.filterTopics()
    if (checked) {
      this.filterTopics.set([...selected, topic])
    } else {
      this.filterTopics.set(selected.filter((t) => t !== topic))
    }
  }
}
