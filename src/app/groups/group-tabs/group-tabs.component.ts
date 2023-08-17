import { Group, GroupId } from '$groups/model/group'
import { filterNotNull } from '$groups/util/filter'
import { UIStore } from '$store/ui.store'
import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { Actions } from '@ngneat/effects-ng'
import { NzAlertModule } from 'ng-zorro-antd/alert'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTabChangeEvent, NzTabsModule } from 'ng-zorro-antd/tabs'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { firstValueFrom, map, switchMap, tap } from 'rxjs'
import { fetchGroups } from '../store/group.actions'
import { GroupStore } from '../store/group.store'
import { FeatureTabsComponent } from './feature-tabs/feature-tabs.component'

@Component({
  selector: 'gcd-group-tabs',
  standalone: true,
  imports: [
    CommonModule,
    NzAlertModule,
    NzButtonModule,
    NzTabsModule,
    NzSpinModule,
    NzToolTipModule,
    FeatureTabsComponent
  ],
  templateUrl: './group-tabs.component.html',
  styleUrls: ['./group-tabs.component.scss']
})
export class GroupTabsComponent {
  groups$ = this.groupStore.groups$
  loading$ = this.groupStore.loading$
  selectedGroupId$ = this.groupStore.selectedGroupId$.pipe(filterNotNull)

  selectedIndex$ = this.groupStore.selectedGroupId$.pipe(
    switchMap((gid) => this.groups$.pipe(map((groups) => groups.findIndex(({ id }) => id === gid)))),
    tap((index) => index === -1 && this.onChange({ index: 0, tab: null }))
  )

  constructor(private groupStore: GroupStore, private uiStore: UIStore, private actions: Actions) {
    this.actions.dispatch(fetchGroups())
  }

  OnReload(): void {
    window.location.reload()
  }

  async onChange({ index }: NzTabChangeEvent): Promise<void> {
    const groups = await firstValueFrom(this.groups$)
    if (groups.length > 0) {
      const { id: groupId } = groups[index!]
      this.groupStore.selectGroupId(groupId)
      this.uiStore.selectFeatureTabIndex(groupId, 0)
    }
  }

  trackById(_: number, { id }: Group): GroupId {
    return id
  }
}
