import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core'
import { filter, map, Observable } from 'rxjs'
import { GroupId } from '../../models/group'
import { ProjectWithLatestPipeline } from '../../models/project-with-pipeline'
import { ProjectService } from '../../services/project.service'

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
    this.tabs$ = this.projectService.filteredProjects().pipe(
      map(
        (all) =>
          Object.entries(all)
            .filter(([_, projects]) => projects.length > 0)
            .map(([status, projects]) => ({
              status,
              projects,
              groupId: this.groupId,
            }))

            .sort((a, b) => a.status.localeCompare(b.status)) as any
      )
    )
  }
}
