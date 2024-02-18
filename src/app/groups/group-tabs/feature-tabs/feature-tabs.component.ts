import { filterNotNull } from '$groups/util/filter'
import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router } from '@angular/router'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTabChangeEvent, NzTabsModule } from 'ng-zorro-antd/tabs'
import { map } from 'rxjs'
import { LatestPipelinesComponent } from './latest-pipelines/latest-pipelines.component'
import { PipelinesComponent } from './pipelines/pipelines.component'
import { SchedulesComponent } from './schedules/schedules.component'

interface Tab {
  id: 'latest-pipelines' | 'pipelines' | 'schedules'
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
  tabs: Tab[] = [
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

  selectedIndex$ = this.route.paramMap.pipe(
    map((map) => map.get('featureId')),
    filterNotNull,
    map((featureId) => this.tabs.findIndex(({ id }) => id === featureId))
  )

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
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
    const { id } = this.tabs[index!]
    const currentSegments = this.route.snapshot.url.map(({ path }) => path)
    this.router.navigate([...currentSegments.slice(0, -1), id])
  }
}
