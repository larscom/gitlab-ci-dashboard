import { retryConfig } from '$groups/http'
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
  selector: 'gcd-create-pipeline-icon',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzToolTipModule, NzButtonModule, NzNotificationModule],
  templateUrl: './create-pipeline-icon.component.html',
  styleUrls: ['./create-pipeline-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePipelineIconComponent {
  private http = inject(HttpClient)
  private config = inject(ConfigService)
  private notification = inject(NzNotificationService)

  projectId = input.required<ProjectId>()
  branch = input.required<string>()

  loading = signal(false)
  vars = signal<Record<string, string>>({})

  read_only = this.config.read_only

  tooltipTitle = computed(() => {
    if (this.read_only()) {
      return 'Read-only mode is enabled'
    }

    if (this.loading()) {
      return ''
    }

    return 'Create a new pipeline'
  })

  create(e: Event): void {
    e.stopPropagation()

    const body = { project_id: this.projectId(), branch: this.branch(), env_vars: this.vars() }

    this.loading.set(true)

    this.http
      .post('/api/pipelines/create', body)
      .pipe(
        retry(retryConfig),
        finalize(() => {
          this.loading.set(false)
        })
      )
      .subscribe({
        complete: () => this.notification.success('Success', 'Created new pipeline.'),
        error: ({ status, statusText, error }: HttpErrorResponse) => {
          if (status === HttpStatusCode.Forbidden) {
            this.notification.error(
              'Forbidden',
              'Failed to create a new pipeline, a read/write access token is required.'
            )
          } else {
            this.notification.error(
              `Error ${status}: ${statusText}`,
              error ? error.message : 'Failed to create a new pipeline'
            )
          }
        }
      })
  }
}
