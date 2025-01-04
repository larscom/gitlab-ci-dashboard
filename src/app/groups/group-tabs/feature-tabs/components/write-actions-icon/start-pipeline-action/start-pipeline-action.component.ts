import { ProjectId } from '$groups/model/project'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal'
import { ModalData, StartPipelineModalComponent } from './start-pipeline-modal/start-pipeline-modal.component'

@Component({
  selector: 'gcd-start-pipeline-action',
  imports: [CommonModule, NzIconModule, NzButtonModule, NzModalModule],
  templateUrl: './start-pipeline-action.component.html',
  styleUrls: ['./start-pipeline-action.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StartPipelineActionComponent {
  private modal = inject(NzModalService)

  projectId = input.required<ProjectId>()
  branch = input.required<string>()


  loading = signal(false)

  start() {
    const nzData: ModalData = { projectId: this.projectId(), branch: this.branch(), loadingIcon: this.loading }

    this.modal.create({
      nzTitle: 'Start a new pipeline',
      nzWidth: '30vw',
      nzContent: StartPipelineModalComponent,
      nzData
    })
  }
}
