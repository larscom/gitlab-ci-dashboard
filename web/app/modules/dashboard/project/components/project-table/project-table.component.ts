import { ProjectWithLatestPipeline } from '@app/core/models/project-with-pipeline'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'

@Component({
  selector: 'gcd-project-table',
  templateUrl: './project-table.component.html',
  styleUrls: ['./project-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTableComponent {
  @Input() projects: ProjectWithLatestPipeline[] = []

  displayedColumns = ['Id', 'Name', 'Branch', 'Source', 'When', 'Topics']

  openGitlab({ pipeline, project }: ProjectWithLatestPipeline): void {
    if (pipeline) {
      window.open(pipeline.web_url, '_blank')
    } else {
      window.open(`${project.web_url}/-/pipelines`, '_blank')
    }
  }
}
