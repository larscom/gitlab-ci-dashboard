import { retryConfig } from '$groups/http'
import { PipelineId } from '$groups/model/pipeline'
import { ProjectId } from '$groups/model/project'
import { ConfigService } from '$service/config.service'
import { CommonModule } from '@angular/common'
import { HttpClient, HttpErrorResponse, HttpStatusCode } from '@angular/common/http'
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { finalize, retry } from 'rxjs'

@Component({
  selector: 'gcd-retry-pipeline-icon',
  imports: [CommonModule, NzIconModule, NzToolTipModule, NzButtonModule, NzNotificationModule],
  templateUrl: './retry-pipeline-icon.component.html',
  styleUrls: ['./retry-pipeline-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RetryPipelineIconComponent {
  private http = inject(HttpClient)
  private config = inject(ConfigService)
  private notification = inject(NzNotificationService)

  projectId = input.required<ProjectId>()
  pipelineId = input.required<PipelineId>()

  loading = signal(false)
  read_only = this.config.read_only

  tooltipTitle = computed(() => {
    if (this.read_only()) {
      return 'Read-only mode is enabled'
    }

    if (this.loading()) {
      return ''
    }

    return 'Retry pipeline'
  })

  retry(e: Event): void {
    e.stopPropagation()

    const params = { project_id: this.projectId(), pipeline_id: this.pipelineId() }

    this.loading.set(true)

    this.http
      .post('/api/pipelines/retry', null, { params })
      .pipe(
        retry(retryConfig),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        complete: () => this.notification.success('Success', 'Restarted jobs for pipeline.'),
        error: ({ status, error }: HttpErrorResponse) => {
          if (status === HttpStatusCode.Forbidden) {
            this.notification.error('Forbidden', 'Failed to retry pipeline, a read/write access token is required.')
          } else {
            this.notification.error(`Error ${status}`, error ? error.message : 'Failed to retry pipeline')
          }
        }
      })
  }
}
