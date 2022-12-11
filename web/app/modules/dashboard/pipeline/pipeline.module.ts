import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { ProjectModule } from '@modules/dashboard/project/project.module'
import { MaterialModule } from '@shared/material.module'
import { PipelineStatusTabsComponent } from './components/pipeline-status-tabs/pipeline-status-tabs.component'

@NgModule({
  declarations: [PipelineStatusTabsComponent],
  imports: [CommonModule, MaterialModule, ProjectModule],
  exports: [PipelineStatusTabsComponent],
})
export class PipelineModule {}
