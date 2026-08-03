import { Project } from '$groups/model/project'
import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzInputModule } from 'ng-zorro-antd/input'
import { NzTooltipModule } from 'ng-zorro-antd/tooltip'

@Component({
  selector: 'gcd-group-filter',
  imports: [FormsModule, NzIconModule, NzInputModule, NzTooltipModule],
  templateUrl: './group-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupFilterComponent {
  projects = input.required<Project[]>()
  filterText = model.required<string>()

  groupCount = computed(() => new Set(this.projects().map(({ namespace }) => namespace.id)).size)
}
