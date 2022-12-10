import { MaterialModule } from '@/shared/material.module'
import { PipesModule } from '@/shared/pipes/pipes.module'
import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { GroupFilterComponent } from './components/group-filter/group-filter.component'
import { GroupTabsComponent } from './components/group-tabs/group-tabs.component'
import { PipelineStatusTabsComponent } from './components/pipeline-status-tabs/pipeline-status-tabs.component'
import { ProjectFilterComponent } from './components/project-filter/project-filter.component'
import { ProjectTableComponent } from './components/project-table/project-table.component'
import { DashboardRoutingModule } from './dashboard-routing.module'
import { DashboardPage } from './dashboard.page'
import { GroupService } from './services/group.service'
import { ProjectService } from './services/project.service'
import { GroupStore } from './store/group-store'
import { ProjectStore } from './store/project-store'

@NgModule({
  declarations: [
    DashboardPage,
    ProjectTableComponent,
    PipelineStatusTabsComponent,
    ProjectFilterComponent,
    GroupFilterComponent,
    GroupTabsComponent,
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    MaterialModule,
    PipesModule,
    ReactiveFormsModule,
  ],
  providers: [GroupStore, ProjectStore, GroupService, ProjectService],
})
export class DashboardModule {}
