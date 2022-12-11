import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { PipelineModule } from '@modules/dashboard/pipeline/pipeline.module'
import { MaterialModule } from '@shared/material.module'
import { GroupFilterComponent } from './components/group-filter/group-filter.component'
import { GroupOverviewComponent } from './components/group-overview/group-overview.component'
import { GroupTabsComponent } from './components/group-tabs/group-tabs.component'
import { GroupService } from './services/group.service'
import { GroupStore } from './store/group-store'

@NgModule({
  declarations: [
    GroupOverviewComponent,
    GroupFilterComponent,
    GroupTabsComponent,
  ],
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, PipelineModule],
  providers: [GroupStore, GroupService],
  exports: [GroupOverviewComponent],
})
export class GroupModule {}
