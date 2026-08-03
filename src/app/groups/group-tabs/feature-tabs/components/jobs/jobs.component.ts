import { FETCH_REFRESH_INTERVAL, retryConfig } from '$groups/http'
import { Job, JobId } from '$groups/model/job'
import { PipelineId } from '$groups/model/pipeline'
import { ProjectId } from '$groups/model/project'
import { Status } from '$groups/model/status'

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
  output,
  runInInjectionContext,
  signal
} from '@angular/core'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTagModule } from 'ng-zorro-antd/tag'
import { NzTooltipModule } from 'ng-zorro-antd/tooltip'
import { EMPTY, Subscription, expand, map, retry, switchMap, tap, timer } from 'rxjs'
import { MaxLengthPipe } from '../../pipes/max-length.pipe'
import { StatusColorPipe } from '../../pipes/status-color.pipe'

interface Tag {
  job: Job
  icon: string
  spin: boolean
  downstream: boolean
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

const POLLING_STATUSES = [
  Status.CREATED,
  Status.WAITING_FOR_RESOURCE,
  Status.PREPARING,
  Status.PENDING,
  Status.RUNNING
]

@Component({
  selector: 'gcd-jobs',
  imports: [NzTagModule, NzIconModule, NzSpinModule, NzTooltipModule, StatusColorPipe, MaxLengthPipe],
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
  downstreamStatusChange = output<Status | undefined>()

  tags = signal<Tag[]>([])
  loading = signal(true)

  ngOnChanges(changes: SimpleChanges): void {
    const scope = changes['scope']
    const current: Status[] = scope?.currentValue ?? []
    const previous: Status[] = scope?.previousValue ?? []
    const pipelineChanged = Boolean(changes['projectId'] || changes['pipelineId'])

    if (!pipelineChanged && !scope?.firstChange && this.isSameArray(current, previous)) {
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

    const request$ = this.http.get<Job[]>('api/jobs', { params })

    this.subscription = request$
      .pipe(
        retry(retryConfig),
        expand((jobs) =>
          this.hasActiveJobs(jobs)
            ? timer(FETCH_REFRESH_INTERVAL).pipe(switchMap(() => request$.pipe(retry(retryConfig))))
            : EMPTY
        ),
        tap(() => this.loading.set(false)),
        map((jobs) => {
          this.downstreamStatusChange.emit(this.getDownstreamStatus(jobs, pipeline_id))
          return jobs.map((job) => {
            const icon = this.getTagIcon(job)
            const spin = RUNNABLE_STATUSES.includes(job.status)
            const downstream = job.pipeline.id !== pipeline_id
            return { job, icon, spin, downstream }
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

  private hasActiveJobs(jobs: Job[]): boolean {
    return jobs.some(({ status }) => POLLING_STATUSES.includes(status))
  }

  private getDownstreamStatus(jobs: Job[], parentPipelineId: PipelineId): Status | undefined {
    const downstreamJobs = jobs.filter(
      (job) => job.pipeline.id !== parentPipelineId && !(job.status === Status.FAILED && job.allow_failure)
    )

    const priority: Status[] = [
      Status.RUNNING,
      Status.PENDING,
      Status.PREPARING,
      Status.WAITING_FOR_RESOURCE,
      Status.CREATED,
      Status.FAILED,
      Status.CANCELED
    ]

    return priority.find((status) => downstreamJobs.some((job) => job.status === status))
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
