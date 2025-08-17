import { Job } from '$groups/model/job'
import { PipelineId } from '$groups/model/pipeline'
import { ProjectId } from '$groups/model/project'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { ChangeDetectionStrategy, Component, computed, inject, Injector, input, model } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTagModule } from 'ng-zorro-antd/tag'
import { forkJoin } from 'rxjs'
import { map, mergeMap } from 'rxjs/operators'

@Component({
  selector: 'gcd-job-filter',
  imports: [CommonModule, NzTagModule, NzSpinModule],
  templateUrl: './job-filter.component.html',
  styleUrls: ['./job-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobFilterComponent {
  private http = inject(HttpClient)
  private injector = inject(Injector)

  projects = input.required<[ProjectId, PipelineId][]>()
  filterJobs = model.required<Job[]>()
  loading = input(false)

  filterJobNames = computed(() => [...new Set(this.filterJobs().map(({ name }) => name))])
  
  // TODO: fix me so it only calls if projects are different
  jobs = toSignal(
    toObservable(this.projects, { injector: this.injector }).pipe(
      mergeMap((projects) => {
        const names = projects.map(([project_id, pipeline_id]) => {
          const params = { project_id, pipeline_id, scope: '' }
          return this.http.get<Job[]>('/api/jobs', { params })
        })
        return forkJoin(names)
      }),
      map((jobs) => [...new Set(jobs.flat())])
    ),
    { initialValue: [] }
  )

  onJobChange(checked: boolean, job: Job): void {
    const selected = this.filterJobs()
    if (checked) {
      this.filterJobs.set([...selected, job])
    } else {
      this.filterJobs.set(selected.filter((j) => j.id !== job.id))
    }
  }
}
