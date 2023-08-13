import { ProjectWithPipeline } from '$groups/model/pipeline'
import { compareStringDate } from '$groups/util/compare'
import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
  name: 'sortProjects',
  standalone: true
})
export class SortProjectsPipe implements PipeTransform {
  transform(projects: ProjectWithPipeline[] = []): ProjectWithPipeline[] {
    return projects.sort((a, b) => compareStringDate(b.pipeline?.updated_at, a.pipeline?.updated_at))
  }
}
