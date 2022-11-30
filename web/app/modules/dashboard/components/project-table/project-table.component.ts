import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { ProjectWithPipelines } from '../../models/project-with-pipelines'

@Component({
  selector: 'gcd-project-table',
  templateUrl: './project-table.component.html',
  styleUrls: ['./project-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTableComponent {
  @Input() projects: ProjectWithPipelines[] = []

  displayedColumns = ['Id', 'Name', 'Branch']

  openGitlab({ pipelines }: ProjectWithPipelines): void {
    const latest = pipelines[0]
    if (latest) {
      window.open(latest.web_url, '_blank')
    }
  }
}
