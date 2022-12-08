import { Component, OnChanges, OnInit } from '@angular/core'
import { map, Observable } from 'rxjs'
import { GroupId } from '../../models/group'
import { GroupService } from '../../services/group.service'

interface Tab {
  name: string
  groupId: GroupId
}

@Component({
  selector: 'gcd-group-tabs',
  templateUrl: './group-tabs.component.html',
})
export class GroupTabsComponent implements OnInit {
  tabs$!: Observable<Tab[]>

  readonly groupsLoading$ = this.groupService.isLoading()

  constructor(private readonly groupService: GroupService) {
    this.groupService.fetchGroups().subscribe()
  }

  ngOnInit(): void {
    this.tabs$ = this.groupService.filteredGroups().pipe(
      map((groups) =>
        groups.map(({ name, id: groupId }) => ({
          name: name.toLocaleUpperCase(),
          groupId,
        }))
      )
    )
  }

  ngOnChanges(): void {}
}
