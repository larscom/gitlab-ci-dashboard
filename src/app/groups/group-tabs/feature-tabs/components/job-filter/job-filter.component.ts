import { Job } from '$groups/model/job'
import { Status } from '$groups/model/status'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTagModule } from 'ng-zorro-antd/tag'

@Component({
  selector: 'gcd-job-filter',
  imports: [CommonModule, NzTagModule, NzSpinModule],
  templateUrl: './job-filter.component.html',
  styleUrls: ['./job-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobFilterComponent {
  jobs = input.required<Job[]>()
  filterJobs = model.required<string[]>()
  loading = input(false)

  jobNames = computed(() => [
    ...new Set(
      this.jobs()
        .filter(({ status }) => status === Status.FAILED)
        .map(({ name }) => name)
    )
  ])

  onJobChange(checked: boolean, job: string): void {
    const selected = this.filterJobs()
    if (checked) {
      this.filterJobs.set([...selected, job])
    } else {
      this.filterJobs.set(selected.filter((j) => j !== job))
    }
  }
}
