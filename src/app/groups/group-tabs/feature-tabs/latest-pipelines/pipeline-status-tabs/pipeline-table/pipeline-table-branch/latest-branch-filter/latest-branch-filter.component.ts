import { Branch } from '$groups/model/branch'
import { ChangeDetectionStrategy, Component, input, model } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzInputModule } from 'ng-zorro-antd/input'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'

@Component({
  selector: 'gcd-latest-branch-filter',
  imports: [NzIconModule, NzInputModule, NzButtonModule, NzToolTipModule, FormsModule],
  templateUrl: './latest-branch-filter.component.html',
  styleUrls: ['./latest-branch-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LatestBranchFilterComponent {
  branchCount = input.required<number>()
  filterText = model.required<string>()
}
