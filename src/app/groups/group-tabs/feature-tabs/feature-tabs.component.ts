import { GroupId } from '$groups/model/group'
import { UIStore } from '$store/ui.store'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTabChangeEvent, NzTabsModule } from 'ng-zorro-antd/tabs'
import { Observable } from 'rxjs'
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
  styleUrls: ['./feature-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureTabsComponent implements OnChanges {
  @Input({ required: true }) selectedGroupId!: GroupId

  selectedIndex$!: Observable<number>

  tabs: Tab[] = [
    {
      id: 'latest_pipelines',
      title: 'Pipelines (latest)',
      icon: 'ci'
    },
    {
      id: 'pipelines',
      title: 'Pipelines',
      icon: 'ci'
    },
    {
      id: 'schedules',
      title: 'Schedules',
      icon: 'schedule'
    }
  ]

  constructor(private uiStore: UIStore) {}

  ngOnChanges({ selectedGroupId }: SimpleChanges): void {
    if (selectedGroupId) {
      this.selectedIndex$ = this.uiStore.selectedFeatureTabIndex(this.selectedGroupId)
    }
  }

  async onChange({ index }: NzTabChangeEvent): Promise<void> {
    this.uiStore.selectFeatureTabIndex(this.selectedGroupId, index!)
  }
}
