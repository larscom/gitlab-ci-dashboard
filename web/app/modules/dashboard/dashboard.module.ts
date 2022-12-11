import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { DashboardRoutingModule } from './dashboard-routing.module'
import { DashboardPage } from './dashboard.page'
import { GroupModule } from './group/group.module'

@NgModule({
  declarations: [DashboardPage],
  imports: [CommonModule, DashboardRoutingModule, GroupModule],
})
export class DashboardModule {}
