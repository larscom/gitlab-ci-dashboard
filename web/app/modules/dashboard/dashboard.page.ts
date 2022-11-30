import { Component } from '@angular/core'
import { GroupService } from './services/group.service'

@Component({
  selector: 'gcd-dashboard-page',
  templateUrl: './dashboard.page.html',
})
export class DashboardPage {
  constructor(private readonly groupService: GroupService) {
    this.groupService.fetchGroups()
  }
}
