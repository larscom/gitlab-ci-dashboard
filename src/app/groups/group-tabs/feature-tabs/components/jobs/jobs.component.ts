import { retryConfig } from '$groups/http-retry-config'
import { Job, JobId } from '$groups/model/job'
import { PipelineId } from '$groups/model/pipeline'
import { ProjectId } from '$groups/model/project'
import { Status } from '$groups/model/status'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnInit,
  Signal,
  inject,
  input,
  runInInjectionContext,
  signal
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTagModule } from 'ng-zorro-antd/tag'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { identity, map, repeat, retry, tap } from 'rxjs'
import { StatusColorPipe } from '../../pipes/status-color.pipe'

interface Tag {
  job: Job
  icon: string
  spin: boolean
}

const RUNNABLE_STATUSES = [
  Status.CREATED,
  Status.WAITING_FOR_RESOURCE,
  Status.PREPARING,
  Status.PENDING,
  Status.RUNNING,
  Status.MANUAL,
  Status.SCHEDULED
]

@Component({
  selector: 'gcd-jobs',
  standalone: true,
  imports: [CommonModule, NzTagModule, NzIconModule, NzSpinModule, NzToolTipModule, StatusColorPipe],
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobsComponent implements OnInit {
  projectId = input.required<ProjectId>()
  pipelineId = input.required<PipelineId>()
  scope = input<Status[]>([])

  http = inject(HttpClient)
  injector = inject(Injector)

  tags: Signal<Tag[]> = signal([])
  loading = signal(true)

  ngOnInit(): void {
    runInInjectionContext(this.injector, () => {
      this.tags = this.createTags()
    })
  }

  trackById(_: number, { id }: Job): JobId {
    return id
  }

  onActionClick(e: Event, { web_url }: Job): void {
    e.stopPropagation()
    window.open(web_url, '_blank')
  }

  private createTags(): Signal<Tag[]> {
    const projectId = this.projectId()
    const pipelineId = this.pipelineId()
    const scope = this.scope().join(',')
    const params = { projectId, pipelineId, scope }
    return toSignal(
      this.http.get<Job[]>('/api/jobs', { params }).pipe(
        retry(retryConfig),
        this.withRepeat() ? repeat({ delay: 2000 }) : identity,
        tap(() => this.loading.set(false)),
        map((jobs) => {
          return jobs.map((job) => {
            const icon = this.getTagIcon(job)
            const spin = RUNNABLE_STATUSES.includes(job.status)
            return { job, icon, spin }
          })
        })
      ),
      {
        initialValue: []
      }
    )
  }

  private withRepeat(): boolean {
    return this.scope().some((scope) => RUNNABLE_STATUSES.includes(scope))
  }

  private getTagIcon(job: Job): string {
    if (job.status === Status.SUCCESS) {
      return 'check-circle'
    }
    if ([Status.FAILED, Status.CANCELED].includes(job.status)) {
      return 'close-circle'
    }
    if (RUNNABLE_STATUSES.includes(job.status)) {
      return 'sync'
    }

    return 'clock-circle'
  }
}
