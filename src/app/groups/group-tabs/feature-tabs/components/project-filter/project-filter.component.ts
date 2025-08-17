import { Project } from '$groups/model/project'

import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzInputModule } from 'ng-zorro-antd/input'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTagModule } from 'ng-zorro-antd/tag'
import { NzTooltipModule } from 'ng-zorro-antd/tooltip'

@Component({
  selector: 'gcd-project-filter',
  imports: [NzIconModule, NzInputModule, NzTagModule, NzButtonModule, NzTooltipModule, NzSpinModule, FormsModule],
  templateUrl: './project-filter.component.html',
  styleUrls: ['./project-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectFilterComponent {
  projects = input.required<Project[]>()
  filterText = model.required<string>()

  projectCount = computed(() => new Set(this.projects().map(({ id }) => id)).size)
}
