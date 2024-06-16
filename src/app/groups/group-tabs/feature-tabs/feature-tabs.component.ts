import { filterNotNull } from '$groups/util/filter'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router } from '@angular/router'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTabChangeEvent, NzTabsModule } from 'ng-zorro-antd/tabs'
import { map } from 'rxjs'
import { LatestPipelinesComponent } from './latest-pipelines/latest-pipelines.component'
import { PipelinesComponent } from './pipelines/pipelines.component'
import { SchedulesComponent } from './schedules/schedules.component'
import { GroupId } from '$groups/model/group'
import { ProjectId } from '$groups/model/project'

interface Tab {
  id: 'latest-pipelines' | 'pipelines' | 'schedules'
  title: string
  icon: string
}

const tabs: Tab[] = [
  {
    id: 'latest-pipelines',
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

@Component({
  selector: 'gcd-feature-tabs',
  standalone: true,
  imports: [CommonModule, NzTabsModule, NzIconModule, LatestPipelinesComponent, PipelinesComponent, SchedulesComponent],
  templateUrl: './feature-tabs.component.html',
  styleUrls: ['./feature-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureTabsComponent {
  groupMap = input.required<Map<GroupId, Set<ProjectId>>>()
  disableRouting = input(false)

  tabs: Tab[] = tabs

  selectedIndex$ = this.route.paramMap.pipe(
    map((map) => map.get('featureId')),
    filterNotNull,
    map((featureId) => this.tabs.findIndex(({ id }) => id === featureId))
  )

  constructor(private route: ActivatedRoute, private router: Router) {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(),
        map((map) => map.get('featureId'))
      )
      .subscribe((featureId) => {
        if (!this.tabs.map(({ id }) => id).includes(featureId as Tab['id'])) {
          this.onChange({ index: 0, tab: null })
        }
      })
  }

  onChange({ index }: NzTabChangeEvent): void {
    if (this.disableRouting()) return

    const { id } = this.tabs[index!]
    const currentSegments = this.route.snapshot.url.map(({ path }) => path)
    this.router.navigate([...currentSegments.slice(0, -1), id])
  }
}
