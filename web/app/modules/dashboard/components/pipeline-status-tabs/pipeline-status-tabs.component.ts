import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core'
import { map, Observable } from 'rxjs'
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
    this.tabs$ = this.projectService.fetchProjects(this.groupId).pipe(
      map((all) =>
        Object.entries(all)
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
