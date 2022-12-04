import { MaterialModule } from '@/shared/material.module'
import { PipesModule } from '@/shared/pipes/pipes.module'
import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { GroupOverviewComponent } from './components/group-overview/group-overview.component'
import { GroupTabsComponent } from './components/group-tabs/group-tabs.component'
import { PipelineStatusTabsComponent } from './components/pipeline-status-tabs/pipeline-status-tabs.component'
import { ProjectTableComponent } from './components/project-table/project-table.component'
import { DashboardRoutingModule } from './dashboard-routing.module'
import { DashboardPage } from './dashboard.page'
import { DashboardStore } from './dashboard.store'
import { GroupService } from './services/group.service'
import { ProjectService } from './services/project.service'

@NgModule({
  declarations: [
    DashboardPage,
    ProjectTableComponent,
    PipelineStatusTabsComponent,
    GroupOverviewComponent,
    GroupTabsComponent,
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    MaterialModule,
    PipesModule,
    ReactiveFormsModule,
  ],
  providers: [DashboardStore, GroupService, ProjectService],
})
export class DashboardModule {}
