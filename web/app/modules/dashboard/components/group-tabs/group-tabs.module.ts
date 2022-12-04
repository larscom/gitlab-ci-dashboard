import { MaterialModule } from '@/shared/material.module'
import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { PipelineStatusTabsModule } from '../pipeline-status-tabs/pipeline-status-tabs.module'

import { GroupTabsComponent } from './group-tabs.component'

@NgModule({
  declarations: [GroupTabsComponent],
  imports: [CommonModule, MaterialModule, PipelineStatusTabsModule],
  exports: [GroupTabsComponent],
})
export class GroupTabsModule {}
