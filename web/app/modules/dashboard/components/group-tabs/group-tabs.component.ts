import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
} from '@angular/core'
import { Group, GroupId } from '../../models/group'
import { GroupService } from '../../services/group.service'

interface Tab {
  name: string
  groupId: GroupId
}

@Component({
  selector: 'gcd-group-tabs',
  templateUrl: './group-tabs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupTabsComponent implements OnChanges {
  @Input() groups: Group[] = []

  tabs: Tab[] | undefined

  readonly groupsLoading$ = this.groupService.isLoading()

  constructor(private readonly groupService: GroupService) {}

  ngOnChanges(): void {
    this.tabs = this.groups.map(({ name, id: groupId }) => ({
      name: name.toLocaleUpperCase(),
      groupId,
    }))
  }
}
