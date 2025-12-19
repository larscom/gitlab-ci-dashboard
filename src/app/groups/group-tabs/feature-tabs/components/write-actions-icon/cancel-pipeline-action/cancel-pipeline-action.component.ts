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
  selector: 'gcd-cancel-pipeline-action',
  imports: [NzIconModule, NzButtonModule],
  templateUrl: './cancel-pipeline-action.component.html',
  styleUrls: ['./cancel-pipeline-action.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CancelPipelineActionComponent {
  private http = inject(HttpClient)
  private notification = inject(NzNotificationService)

  projectId = input.required<ProjectId>()
  pipelineId = input.required<PipelineId>()

  loading = signal(false)

  cancel(): void {
    const params = { project_id: this.projectId(), pipeline_id: this.pipelineId() }

    this.loading.set(true)

    this.http
      .post('api/pipelines/cancel', null, { params })
      .pipe(
        retry(retryConfig),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        complete: () => this.notification.success('Success', 'Canceled pipeline.'),
        error: ({ status, error }: HttpErrorResponse) => {
          if (status === HttpStatusCode.Forbidden) {
            this.notification.error('Forbidden', 'Failed to cancel pipeline, a read/write access token is required.')
          } else {
            this.notification.error(`Error ${status}`, error ? error.message : 'Failed to cancel pipeline')
          }
        }
      })
  }
}
