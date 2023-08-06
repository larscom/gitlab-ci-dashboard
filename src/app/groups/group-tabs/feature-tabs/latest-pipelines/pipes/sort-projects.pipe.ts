import { ProjectWithLatestPipeline } from '$model/pipeline'
import { compareStringDate } from '$util/compare'
import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
  name: 'sortProjects',
  standalone: true
})
export class SortProjectsPipe implements PipeTransform {
  transform(projects: ProjectWithLatestPipeline[] = []): ProjectWithLatestPipeline[] {
    return projects.sort((a, b) => compareStringDate(b.latest_pipeline?.updated_at, a.latest_pipeline?.updated_at))
  }
}
