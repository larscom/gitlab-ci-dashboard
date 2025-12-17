import { FETCH_REFRESH_INTERVAL, retryConfig } from '$groups/http'
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
  OnChanges,
  OnDestroy,
  SimpleChanges,
  inject,
  input,
  runInInjectionContext,
  signal
} from '@angular/core'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTagModule } from 'ng-zorro-antd/tag'
import { NzTooltipModule } from 'ng-zorro-antd/tooltip'
import { Subscription, identity, map, repeat, retry, tap } from 'rxjs'
import { MaxLengthPipe } from '../../pipes/max-length.pipe'
import { StatusColorPipe } from '../../pipes/status-color.pipe'

interface Tag {
  job: Job
  icon: string
  spin: boolean
}

const MAX_JOB_COUNT = 6
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
  imports: [CommonModule, NzTagModule, NzIconModule, NzSpinModule, NzTooltipModule, StatusColorPipe, MaxLengthPipe],
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobsComponent implements OnChanges, OnDestroy {
  private http = inject(HttpClient)
  private injector = inject(Injector)
  private subscription?: Subscription

  projectId = input.required<ProjectId>()
  pipelineId = input.required<PipelineId>()
  scope = input<Status[]>([])

  tags = signal<Tag[]>([])
  loading = signal(true)

  ngOnChanges({ scope }: SimpleChanges): void {
    const current: Status[] = scope?.currentValue ?? []
    const previous: Status[] = scope?.previousValue ?? []
    if (this.isSameArray(current, previous)) {
      return
    }
    runInInjectionContext(this.injector, () => this.subscribeToJobs())
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe()
  }

  trackById({ id }: Job): JobId {
    return id
  }

  onActionClick(e: Event, { web_url }: Job): void {
    e.stopPropagation()
    window.open(web_url, '_blank')
  }

  private isSameArray<T>(a: T[], b: T[]): boolean {
    return a.length === b.length && a.every((value, index) => value === b[index])
  }

  private subscribeToJobs(): void {
    this.subscription?.unsubscribe()

    const project_id = this.projectId()
    const pipeline_id = this.pipelineId()
    const scope = this.scope().join(',')
    const params = { project_id, pipeline_id, scope }

    this.subscription = this.http
      .get<Job[]>('api/jobs', { params })
      .pipe(
        retry(retryConfig),
        this.withRepeat() ? repeat({ delay: FETCH_REFRESH_INTERVAL }) : identity,
        tap(() => this.loading.set(false)),
        map((jobs) => {
          return jobs.slice(0, MAX_JOB_COUNT).map((job) => {
            const icon = this.getTagIcon(job)
            const spin = RUNNABLE_STATUSES.includes(job.status)
            return { job, icon, spin }
          })
        })
      )
      .subscribe((tags) => this.tags.set(tags))
  }

  getStatus(job: Job): Status {
    if (job.status === Status.FAILED && job.allow_failure) {
      return Status.FAILED_ALLOW_FAILURE
    }
    return job.status
  }

  private withRepeat(): boolean {
    return this.scope().some((scope) => RUNNABLE_STATUSES.includes(scope))
  }

  private getTagIcon(job: Job): string {
    if (job.status === Status.SUCCESS) {
      return 'check-circle'
    }
    if (job.status === Status.FAILED && job.allow_failure) {
      return 'exclamation-circle'
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
