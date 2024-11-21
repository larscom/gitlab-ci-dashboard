import { ProjectId } from '$groups/model/project'
import { ConfigService } from '$service/config.service'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { ModalData, StartPipelineModalComponent } from './start-pipeline-modal/start-pipeline-modal.component'

@Component({
  selector: 'gcd-start-pipeline-icon',
  imports: [CommonModule, NzIconModule, NzToolTipModule, NzButtonModule, NzModalModule],
  templateUrl: './start-pipeline-icon.component.html',
  styleUrls: ['./start-pipeline-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StartPipelineIconComponent {
  private config = inject(ConfigService)
  private modal = inject(NzModalService)

  projectId = input.required<ProjectId>()
  branch = input.required<string>()

  loading = signal(false)
  read_only = this.config.read_only

  tooltipTitle = computed(() => {
    if (this.read_only()) {
      return 'Read-only mode is enabled'
    }

    if (this.loading()) {
      return ''
    }

    return 'Start a new pipeline'
  })

  start(e: Event): void {
    e.stopPropagation()

    const nzData: ModalData = { projectId: this.projectId(), branch: this.branch(), loadingIcon: this.loading }

    this.modal.create({
      nzTitle: 'Start a new pipeline',
      nzWidth: '30vw',
      nzContent: StartPipelineModalComponent,
      nzData
    })
  }
}
