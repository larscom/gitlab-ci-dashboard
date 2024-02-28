import { StatusColorPipe } from '$groups/group-tabs/feature-tabs/pipes/status-color.pipe'
import { ProjectPipeline } from '$groups/model/pipeline'
import { Status } from '$groups/model/status'
import { CommonModule } from '@angular/common'
import { Component, Signal, computed, inject } from '@angular/core'
import { NzBadgeModule } from 'ng-zorro-antd/badge'
import { NzEmptyModule } from 'ng-zorro-antd/empty'
import { NzTabsModule } from 'ng-zorro-antd/tabs'
import { LatestProjectFilterService } from '../service/latest-project-filter.service'
import { PipelineTableComponent } from './pipeline-table/pipeline-table.component'

interface Tab {
  status: Status
  projects: ProjectPipeline[]
}

@Component({
  selector: 'gcd-pipeline-status-tabs',
  standalone: true,
  imports: [CommonModule, NzTabsModule, NzBadgeModule, NzEmptyModule, PipelineTableComponent, StatusColorPipe],
  templateUrl: './pipeline-status-tabs.component.html',
  styleUrls: ['./pipeline-status-tabs.component.scss']
})
export class PipelineStatusTabsComponent {
  private filterService = inject(LatestProjectFilterService)

  tabs: Signal<Tab[]> = computed(() => {
    const projects = this.filterService.projectsLatestPipeline()
    return Array.from(
      projects
        .filter(({ pipeline }) => pipeline != null)
        .reduce((current, { pipeline, project }) => {
          const { status } = pipeline!
          const projects = current.get(status)
          const next: ProjectPipeline = { project, pipeline: pipeline! }
          return projects ? current.set(status, [...projects, next]) : current.set(status, [next])
        }, new Map<Status, ProjectPipeline[]>())
    )
      .map(([status, projects]) => ({ status, projects }))
      .sort((a, b) => a.status.localeCompare(b.status))
  })

  trackByStatus(_: number, { status }: Tab): Status {
    return status
  }
}
