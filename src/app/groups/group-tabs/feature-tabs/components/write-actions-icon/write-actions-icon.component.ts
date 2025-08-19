import { PipelineId } from '$groups/model/pipeline'
import { ProjectId } from '$groups/model/project'
import { ConfigService } from '$service/config.service'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, HostListener, inject, input, signal } from '@angular/core'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzDropDownModule } from 'ng-zorro-antd/dropdown'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTooltipModule } from 'ng-zorro-antd/tooltip'
import { CancelPipelineActionComponent } from './cancel-pipeline-action/cancel-pipeline-action.component'
import { RetryPipelineActionComponent } from './retry-pipeline-action/retry-pipeline-action.component'
import { StartPipelineActionComponent } from './start-pipeline-action/start-pipeline-action.component'

@Component({
  selector: 'gcd-write-actions-icon',
  imports: [
    CommonModule,
    NzButtonModule,
    NzIconModule,
    NzDropDownModule,
    NzTooltipModule,
    StartPipelineActionComponent,
    CancelPipelineActionComponent,
    RetryPipelineActionComponent
  ],
  templateUrl: './write-actions-icon.component.html',
  styleUrls: ['./write-actions-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WriteActionsIconComponent {
  private config = inject(ConfigService)

  projectId = input.required<ProjectId>()
  pipelineId = input.required<PipelineId>()
  branch = input.required<string>()

  visible = signal(false)

  readOnly = this.config.readOnly
  tooltipTitle = computed(() => (this.readOnly() ? 'Write actions are disabled' : null))

  @HostListener('click', ['$event']) onClick(e: MouseEvent) {
    e.stopPropagation()
  }
}
