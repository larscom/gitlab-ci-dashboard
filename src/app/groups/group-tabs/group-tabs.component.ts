import { Group, GroupId } from '$groups/model/group'
import { UIStore } from '$store/ui.store'
import { CommonModule } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { Actions } from '@ngneat/effects-ng'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTabChangeEvent, NzTabsModule } from 'ng-zorro-antd/tabs'
import { filter, firstValueFrom, map, switchMap, take, tap } from 'rxjs'
import { fetchGroups } from '../store/group.actions'
import { GroupStore } from '../store/group.store'
import { FeatureTabsComponent } from './feature-tabs/feature-tabs.component'
import {
  fetchProjectsWithLatestPipeline,
  resetAllFilters
} from './feature-tabs/latest-pipelines/store/latest-pipeline.actions'

@Component({
  selector: 'gcd-group-tabs',
  standalone: true,
  imports: [CommonModule, NzTabsModule, NzSpinModule, FeatureTabsComponent],
  templateUrl: './group-tabs.component.html',
  styleUrls: ['./group-tabs.component.scss']
})
export class GroupTabsComponent implements OnInit {
  groups$ = this.groupStore.groups$
  loading$ = this.groupStore.loading$
  selectedIndex$ = this.groupStore.selectedGroupId$.pipe(
    switchMap((gid) => this.groups$.pipe(map((groups) => groups.findIndex(({ id }) => id === gid)))),
    tap((index) => index === -1 && this.onChange({ index: 0, tab: null }))
  )

  constructor(private groupStore: GroupStore, private uiStore: UIStore, private actions: Actions) {}

  ngOnInit(): void {
    this.actions.dispatch(fetchGroups())
    this.groupStore.selectedGroupId$
      .pipe(
        take(1),
        filter((groupId): groupId is GroupId => groupId != null)
      )
      .subscribe((groupId) => this.actions.dispatch(fetchProjectsWithLatestPipeline({ groupId })))
  }

  async onChange({ index }: NzTabChangeEvent): Promise<void> {
    const { id: groupId } = await firstValueFrom(this.groups$.pipe(map((groups) => groups[index!])))

    this.groupStore.selectGroupId(groupId)
    this.uiStore.selectFeatureTabIndex(groupId, 0)
    this.actions.dispatch(fetchProjectsWithLatestPipeline({ groupId }))
    this.actions.dispatch(resetAllFilters())
  }

  trackById(_: number, { id }: Group): GroupId {
    return id
  }
}
