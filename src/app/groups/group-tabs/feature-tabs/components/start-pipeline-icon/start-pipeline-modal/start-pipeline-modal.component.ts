import { retryConfig } from '$groups/http'
import { ProjectId } from '$groups/model/project'
import { BranchService } from '$groups/service/branch.service'
import { CommonModule } from '@angular/common'
import { HttpClient, HttpErrorResponse, HttpStatusCode } from '@angular/common/http'
import { Component, inject, signal, WritableSignal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzFormModule } from 'ng-zorro-antd/form'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzModalModule, NzModalRef } from 'ng-zorro-antd/modal'
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification'
import { NzSelectModule } from 'ng-zorro-antd/select'
import { NzSpaceModule } from 'ng-zorro-antd/space'
import { finalize, map, retry } from 'rxjs'
import { VariablesFormComponent } from './variables-form/variables-form.component'

export interface ModalData {
  projectId: ProjectId
  branch: string
  loadingIcon: WritableSignal<boolean>
}

@Component({
  selector: 'gcd-start-pipeline-modal',
  imports: [
    CommonModule,
    VariablesFormComponent,
    NzButtonModule,
    NzModalModule,
    NzNotificationModule,
    NzSelectModule,
    NzIconModule,
    NzSpaceModule,
    NzFormModule,
    FormsModule
  ],
  templateUrl: './start-pipeline-modal.component.html',
  styleUrls: ['./start-pipeline-modal.component.scss']
})
export class StartPipelineModalComponent {
  private modal = inject(NzModalRef)
  private http = inject(HttpClient)
  private notification = inject(NzNotificationService)
  private branchService = inject(BranchService)

  private modalData: ModalData = this.modal.getConfig().nzData

  variables = signal<Record<string, string>>(Object())

  branchesLoading = signal(true)
  branches = toSignal(
    this.branchService.getBranches(this.modalData.projectId).pipe(
      map((branches) => branches.filter(({ name }) => name !== this.defaultBranch)),
      finalize(() => this.branchesLoading.set(false))
    )
  )

  selectedBranch = this.defaultBranch

  get defaultBranch() {
    return this.modalData.branch
  }

  start() {
    const { projectId, loadingIcon } = this.modalData
    loadingIcon.set(true)

    const variables = this.variables()

    this.http
      .post('/api/pipelines/start', {
        project_id: projectId,
        branch: this.selectedBranch,
        env_vars: Object.keys(variables).length > 0 ? variables : undefined
      })
      .pipe(
        retry(retryConfig),
        finalize(() => loadingIcon.set(false))
      )
      .subscribe({
        complete: () => {
          this.notification.success('Success', 'Started new pipeline.')
          this.close()
        },
        error: ({ status, error }: HttpErrorResponse) => {
          if (status === HttpStatusCode.Forbidden) {
            this.notification.error(
              'Forbidden',
              'Failed to start a new pipeline, a read/write access token is required.'
            )
          } else {
            this.notification.error(`Error ${status}`, error ? error.message : 'Failed to start a new pipeline')
          }
        }
      })

    this.close()
  }

  close() {
    this.modal.destroy()
  }
}
