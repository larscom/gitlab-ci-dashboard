import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { MatTabsModule } from '@angular/material/tabs'
import { ProjectTableModule } from '../project-table/project-table.module'
import { PipelineStatusTabsComponent } from './pipeline-status-tabs.component'
import { MatProgressBarModule } from '@angular/material/progress-bar'

@NgModule({
  declarations: [PipelineStatusTabsComponent],
  imports: [CommonModule, MatTabsModule, MatIconModule, ProjectTableModule, MatProgressBarModule],
  exports: [PipelineStatusTabsComponent],
})
export class PipelineStatusTabsModule {}
