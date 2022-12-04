import { MaterialModule } from '@/app/shared/material.module'
import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { GroupTabsModule } from './components/group-tabs/group-tabs.module'
import { DashboardRoutingModule } from './dashboard-routing.module'
import { DashboardPage } from './dashboard.page'
import { DashboardStore } from './dashboard.store'
import { GroupService } from './services/group.service'
import { ProjectService } from './services/project.service'

@NgModule({
  declarations: [DashboardPage],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    GroupTabsModule,
    MaterialModule,
  ],
  providers: [DashboardStore, GroupService, ProjectService],
})
export class DashboardModule {}
