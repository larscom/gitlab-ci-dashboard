import { retryConfig } from '$groups/http'
import { PipelineId } from '$groups/model/pipeline'
import { ProjectId } from '$groups/model/project'

import { HttpClient, HttpErrorResponse, HttpStatusCode } from '@angular/common/http'
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { finalize, retry } from 'rxjs'

@Component({
  selector: 'gcd-retry-pipeline-action',
  imports: [NzIconModule, NzButtonModule],
  templateUrl: './retry-pipeline-action.component.html',
  styleUrls: ['./retry-pipeline-action.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RetryPipelineActionComponent {
  private http = inject(HttpClient)
  private notification = inject(NzNotificationService)

  projectId = input.required<ProjectId>()
  pipelineId = input.required<PipelineId>()

  loading = signal(false)

  retry() {
    const params = { project_id: this.projectId(), pipeline_id: this.pipelineId() }

    this.loading.set(true)

    this.http
      .post('api/pipelines/retry', null, { params })
      .pipe(
        retry(retryConfig),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        complete: () => this.notification.success('Success', 'Restarted pipeline.'),
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
