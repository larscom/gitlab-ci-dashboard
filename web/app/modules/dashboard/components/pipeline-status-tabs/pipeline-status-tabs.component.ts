import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core'
import { map, Observable, of } from 'rxjs'
import { GroupId } from '../../models/group'
import { ProjectWithPipelines } from '../../models/project-with-pipelines'
import { ProjectService } from '../../services/project.service'

interface Tab {
  status: string
  projects: ProjectWithPipelines[]
  groupId: GroupId
}

@Component({
  selector: 'gcd-pipeline-status-tabs',
  templateUrl: './pipeline-status-tabs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipelineStatusTabsComponent implements OnInit {
  @Input() groupId!: GroupId

  tabs$: Observable<Tab[]> = of([])
  loading$ = this.projectService.isLoading()

  constructor(private readonly projectService: ProjectService) {}

  ngOnInit(): void {
    this.projectService.fetchProjectsWithPipelines(this.groupId)
    this.tabs$ = this.projectService
      .getProjectsGroupedByStatus(this.groupId)
      .pipe(
        map((allProjects) =>
          Object.entries(allProjects)
            .map(([status, projects]) => ({
              status,
              projects,
              groupId: this.groupId,
            }))
            .sort((a, b) => a.status.localeCompare(b.status))
        )
      )
  }
}
