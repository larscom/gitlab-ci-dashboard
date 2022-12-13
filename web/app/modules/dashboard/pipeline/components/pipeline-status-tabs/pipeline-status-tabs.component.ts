import { GroupId } from '@app/core/models/group'
import { ProjectWithLatestPipeline } from '@app/core/models/project-with-pipeline'
import { ProjectService } from '@modules/dashboard/project/services/project.service'
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core'
import { map, Observable } from 'rxjs'

interface Tab {
  status: string
  projects: ProjectWithLatestPipeline[]
  groupId: GroupId
}

@Component({
  selector: 'gcd-pipeline-status-tabs',
  templateUrl: './pipeline-status-tabs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipelineStatusTabsComponent implements OnInit {
  @Input() groupId!: GroupId

  tabs$!: Observable<Tab[]>
  loading$ = this.projectService.isLoading()

  constructor(private readonly projectService: ProjectService) {}

  ngOnInit(): void {
    this.projectService.fetchProjects(this.groupId)
    this.tabs$ = this.projectService.getFilteredProjects().pipe(
      map((all) =>
        Object.entries(all)
          .filter(([_, projects]) => projects.length > 0)
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
