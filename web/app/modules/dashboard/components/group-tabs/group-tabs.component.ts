import { Component, OnInit } from '@angular/core'
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

  readonly loading$ = this.groupService.isLoading()

  constructor(private readonly groupService: GroupService) {}

  ngOnInit(): void {
    this.groupService.fetchGroups()
    this.tabs$ = this.groupService.getFilteredGroups().pipe(
      map((groups) =>
        groups.map(({ name, id: groupId }) => ({
          name: name.toLocaleUpperCase(),
          groupId,
        }))
      )
    )
  }

  get selectedIndex(): number {
    return Number(localStorage.getItem('gcd-group-tabs.selectedIndex') || 0)
  }

  set selectedIndex(index: number) {
    localStorage.setItem('gcd-group-tabs.selectedIndex', String(index))
  }
}
