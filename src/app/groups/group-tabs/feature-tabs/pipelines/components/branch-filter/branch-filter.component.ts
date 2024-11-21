import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core'

import { FormsModule } from '@angular/forms'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzInputModule } from 'ng-zorro-antd/input'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'

@Component({
  selector: 'gcd-branch-filter',
  imports: [NzIconModule, NzInputModule, NzButtonModule, NzToolTipModule, NzSpinModule, FormsModule],
  templateUrl: './branch-filter.component.html',
  styleUrls: ['./branch-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BranchFilterComponent {
  branches = input.required<string[]>()

  filterText = model.required<string>()

  branchCount = computed(() => new Set(this.branches()).size)
}
