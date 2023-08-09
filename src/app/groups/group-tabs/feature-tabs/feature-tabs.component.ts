import { GroupStore } from '$groups/store/group.store'
import { GroupId } from '$groups/model/group'
import { UIStore } from '$store/ui.store'
import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTabChangeEvent, NzTabsModule } from 'ng-zorro-antd/tabs'
import { filter, firstValueFrom, switchMap } from 'rxjs'
import { LatestPipelinesComponent } from './latest-pipelines/latest-pipelines.component'
import { SchedulesComponent } from './schedules/schedules.component'

interface Tab {
  id: 'latest_pipelines' | 'schedules'
  title: string
  icon: string
}

@Component({
  selector: 'gcd-feature-tabs',
  standalone: true,
  imports: [CommonModule, NzTabsModule, NzIconModule, LatestPipelinesComponent, SchedulesComponent],
  templateUrl: './feature-tabs.component.html',
  styleUrls: ['./feature-tabs.component.scss']
})
export class FeatureTabsComponent {
  private selectedGroupId$ = this.groupStore.selectedGroupId$.pipe(filter((id): id is GroupId => id != null))

  selectedIndex$ = this.selectedGroupId$.pipe(switchMap((groupId) => this.uiStore.selectedFeatureTabIndex(groupId)))

  tabs: Tab[] = [
    {
      id: 'latest_pipelines',
      title: 'Pipelines (latest)',
      icon: 'ci'
    },
    {
      id: 'schedules',
      title: 'Schedules',
      icon: 'schedule'
    }
  ]

  constructor(private uiStore: UIStore, private groupStore: GroupStore) {}

  async onChange({ index }: NzTabChangeEvent): Promise<void> {
    const groupId = await firstValueFrom(this.selectedGroupId$)
    this.uiStore.selectFeatureTabIndex(groupId, index!)
  }
}
