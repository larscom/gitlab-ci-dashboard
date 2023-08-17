import { GroupStore } from '$groups/store/group.store'
import { filterNotNull } from '$groups/util/filter'
import { UIStore } from '$store/ui.store'
import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTabChangeEvent, NzTabsModule } from 'ng-zorro-antd/tabs'
import { firstValueFrom, switchMap } from 'rxjs'
import { LatestPipelinesComponent } from './latest-pipelines/latest-pipelines.component'
import { PipelinesComponent } from './pipelines/pipelines.component'
import { SchedulesComponent } from './schedules/schedules.component'

interface Tab {
  id: 'latest_pipelines' | 'pipelines' | 'schedules'
  title: string
  icon: string
}

@Component({
  selector: 'gcd-feature-tabs',
  standalone: true,
  imports: [CommonModule, NzTabsModule, NzIconModule, LatestPipelinesComponent, PipelinesComponent, SchedulesComponent],
  templateUrl: './feature-tabs.component.html',
  styleUrls: ['./feature-tabs.component.scss']
})
export class FeatureTabsComponent {
  private selectedGroupId$ = this.groupStore.selectedGroupId$.pipe(filterNotNull)

  selectedIndex$ = this.selectedGroupId$.pipe(switchMap((groupId) => this.uiStore.selectedFeatureTabIndex(groupId)))

  tabs: Tab[] = [
    {
      id: 'latest_pipelines',
      title: 'Pipelines (latest)',
      icon: 'swap-right'
    },
    {
      id: 'pipelines',
      title: 'Pipelines',
      icon: 'retweet'
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
