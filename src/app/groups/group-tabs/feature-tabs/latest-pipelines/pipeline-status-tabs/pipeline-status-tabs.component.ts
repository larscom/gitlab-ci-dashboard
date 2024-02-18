import { StatusColorPipe } from '$groups/group-tabs/feature-tabs/pipes/status-color.pipe'
import { ProjectWithPipeline } from '$groups/model/pipeline'
import { Status } from '$groups/model/status'
import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { NzBadgeModule } from 'ng-zorro-antd/badge'
import { NzEmptyModule } from 'ng-zorro-antd/empty'
import { NzTabsModule } from 'ng-zorro-antd/tabs'
import { Observable, map } from 'rxjs'
import { ProjectFilterService } from '../../service/project-filter.service'
import { PipelineTableComponent } from './pipeline-table/pipeline-table.component'

interface Tab {
  status: Status
  projects: ProjectWithPipeline[]
}

@Component({
  selector: 'gcd-pipeline-status-tabs',
  standalone: true,
  imports: [CommonModule, NzTabsModule, NzBadgeModule, NzEmptyModule, PipelineTableComponent, StatusColorPipe],
  templateUrl: './pipeline-status-tabs.component.html',
  styleUrls: ['./pipeline-status-tabs.component.scss']
})
export class PipelineStatusTabsComponent {
  filterService = inject(ProjectFilterService)

  tabs$: Observable<Tab[]> = this.filterService.getProjectsWithLatestPipeline().pipe(
    map((map) =>
      Array.from(map)
        .map(([status, projects]) => ({ status, projects }))
        .sort((a, b) => a.status.localeCompare(b.status))
    )
  )

  trackByStatus(_: number, { status }: Tab): Status {
    return status
  }
}
