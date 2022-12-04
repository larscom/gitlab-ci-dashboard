import { MaterialModule } from '@/shared/material.module'
import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { ProjectTableModule } from '../project-table/project-table.module'
import { PipelineStatusTabsComponent } from './pipeline-status-tabs.component'

@NgModule({
  declarations: [PipelineStatusTabsComponent],
  imports: [CommonModule, ProjectTableModule, MaterialModule],
  exports: [PipelineStatusTabsComponent],
})
export class PipelineStatusTabsModule {}
