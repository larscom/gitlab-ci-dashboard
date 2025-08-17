import { StatusColorPipe } from '$groups/group-tabs/feature-tabs/pipes/status-color.pipe'
import { ProjectPipeline } from '$groups/model/project'
import { Status } from '$groups/model/status'
import { filterProject } from '$groups/util/filter'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Signal, computed, input } from '@angular/core'
import { NzBadgeModule } from 'ng-zorro-antd/badge'
import { NzEmptyModule } from 'ng-zorro-antd/empty'
import { NzTabsModule } from 'ng-zorro-antd/tabs'
import { PipelineTableComponent } from './pipeline-table/pipeline-table.component'
import { Job } from '$groups/model/job'
import { Pipeline } from '$groups/model/pipeline'

interface Tab {
  status: Status
  projects: ProjectPipeline[]
}

@Component({
  selector: 'gcd-pipeline-status-tabs',
  imports: [CommonModule, NzTabsModule, NzBadgeModule, NzEmptyModule, PipelineTableComponent, StatusColorPipe],
  templateUrl: './pipeline-status-tabs.component.html',
  styleUrls: ['./pipeline-status-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineStatusTabsComponent {
  projectPipelines = input.required<ProjectPipeline[]>()
  filterText = input.required<string>()
  filterTopics = input.required<string[]>()
  filterJobs = input.required<Job[]>()

  tabs: Signal<Tab[]> = computed(() => {
    return Array.from(
      this.projectPipelines()
        .filter(({ project }) => filterProject(project, this.filterText(), this.filterTopics()))
        .filter(({ pipeline }) => pipeline != null)
        .filter(({ pipeline }) => this.filterJob(pipeline!, this.filterJobs()))
        .reduce((current, { group_id, pipeline, project }) => {
          const { status } = pipeline!
          const projects = current.get(status)
          const next: ProjectPipeline = { group_id, project, pipeline: pipeline! }
          return projects ? current.set(status, [...projects, next]) : current.set(status, [next])
        }, new Map<Status, ProjectPipeline[]>())
    )
      .map(([status, projects]) => ({ status, projects }))
      .sort((a, b) => a.status.localeCompare(b.status))
  })

  trackByStatus({ status }: Tab): Status {
    return status
  }

  filterJob(pipeline: Pipeline, jobs: Job[]) {
    return jobs.length === 0 || jobs.some((job) => job.pipeline.id === pipeline.id)
  }
}
