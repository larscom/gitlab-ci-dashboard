import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatTabsModule } from '@angular/material/tabs'
import { PipelineStatusTabsModule } from '../pipeline-status-tabs/pipeline-status-tabs.module'

import { GroupTabsComponent } from './group-tabs.component'

@NgModule({
  declarations: [GroupTabsComponent],
  imports: [
    CommonModule,
    MatTabsModule,
    MatProgressBarModule,
    PipelineStatusTabsModule,
  ],
  exports: [GroupTabsComponent],
})
export class GroupTabsModule {}
