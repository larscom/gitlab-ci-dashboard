import { Job, JobId } from '$groups/model/job'
import { PipelineId } from '$groups/model/pipeline'
import { ProjectId } from '$groups/model/project'
import { CommonModule } from '@angular/common'
import { HttpClient, HttpErrorResponse, HttpStatusCode } from '@angular/common/http'
import { ChangeDetectionStrategy, Component, HostListener, inject, Injector, input, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import FileSaver from 'file-saver'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzDropDownModule } from 'ng-zorro-antd/dropdown'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { NzTooltipModule } from 'ng-zorro-antd/tooltip'
import { combineLatest, finalize, switchMap } from 'rxjs'
import { StatusColorPipe } from '../../pipes/status-color.pipe'

@Component({
  selector: 'gcd-download-artifacts-icon',
  imports: [CommonModule, NzButtonModule, NzIconModule, NzDropDownModule, NzTooltipModule, StatusColorPipe],
  templateUrl: './download-artifacts-icon.component.html',
  styleUrls: ['./download-artifacts-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DownloadArtifactsIconComponent {
  private http = inject(HttpClient)
  private injector = inject(Injector)
  private notification = inject(NzNotificationService)
  private loadingJobIds = signal<number[]>([])

  projectId = input.required<ProjectId>()
  pipelineId = input.required<PipelineId>()

  jobs = toSignal(
    combineLatest([
      toObservable(this.projectId, { injector: this.injector }),
      toObservable(this.pipelineId, { injector: this.injector })
    ]).pipe(
      switchMap(([projectId, pipelineId]) => {
        const params = {
          project_id: projectId,
          pipeline_id: pipelineId,
          scope: ''
        }

        return this.http.get<Job[]>('/api/jobs', { params })
      })
    ),
    { initialValue: [] }
  )

  isLoading(jobId: JobId): boolean {
    return this.loadingJobIds().includes(jobId)
  }

  download(e: MouseEvent, { id, name }: Job) {
    e.stopPropagation()

    this.loadingJobIds.set([...this.loadingJobIds(), id])

    const params = {
      project_id: this.projectId(),
      job_id: id
    }

    this.http
      .get('/api/artifacts', { params, responseType: 'blob' })
      .pipe(finalize(() => this.loadingJobIds.set(this.loadingJobIds().filter((jobId) => jobId !== id))))
      .subscribe({
        next: (blob) => FileSaver.saveAs(blob, `${name}_${id}.zip`),
        error: ({ status, error }: HttpErrorResponse) => {
          if (status === HttpStatusCode.NotFound) {
            this.notification.error('Not Found', `Failed to download artifact, it's missing from the server`)
          } else {
            this.notification.error(`Error ${status}`, error ? error.message : 'Failed to download artifact')
          }
        }
      })
  }

  @HostListener('click', ['$event']) onClick(e: MouseEvent) {
    e.stopPropagation()
  }
}
