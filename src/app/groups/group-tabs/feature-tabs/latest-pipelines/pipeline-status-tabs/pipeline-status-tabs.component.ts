import { StatusColorPipe } from '$groups/group-tabs/feature-tabs/pipes/status-color.pipe'
import { ProjectWithLatestPipeline, Status } from '$groups/model/pipeline'
import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { NzBadgeModule } from 'ng-zorro-antd/badge'
import { NzEmptyModule } from 'ng-zorro-antd/empty'
import { NzTabsModule } from 'ng-zorro-antd/tabs'
import { Observable, map } from 'rxjs'
import { SortProjectsPipe } from '../pipes/sort-projects.pipe'
import { ProjectFilterService } from '../service/project-filter.service'
import { PipelineTableComponent } from './pipeline-table/pipeline-table.component'

interface Tab {
  status: Status
  projects: ProjectWithLatestPipeline[]
}

@Component({
  selector: 'gcd-pipeline-status-tabs',
  standalone: true,
  imports: [
    CommonModule,
    NzTabsModule,
    NzBadgeModule,
    NzEmptyModule,
    PipelineTableComponent,
    StatusColorPipe,
    SortProjectsPipe
  ],
  templateUrl: './pipeline-status-tabs.component.html',
  styleUrls: ['./pipeline-status-tabs.component.scss']
})
export class PipelineStatusTabsComponent {
  tabs$: Observable<Tab[]> = this.filterService.getProjectsWithLatestPipeline().pipe(
    map((map) =>
      Array.from(map)
        .map(([status, projects]) => ({ status, projects }))
        .sort((a, b) => a.status.localeCompare(b.status))
    )
  )

  constructor(private filterService: ProjectFilterService) {}

  trackByStatus(_: number, { status }: Tab): Status {
    return status
  }
}
