import { ChangeDetectionStrategy, Component, model } from '@angular/core'

import { StatusColorPipe } from '$groups/group-tabs/feature-tabs/pipes/status-color.pipe'
import { Status } from '$groups/model/status'
import { FormsModule } from '@angular/forms'
import { NzSelectModule } from 'ng-zorro-antd/select'
import { NzTagModule } from 'ng-zorro-antd/tag'

@Component({
  selector: 'gcd-status-filter',
  standalone: true,
  imports: [FormsModule, NzTagModule, NzSelectModule, StatusColorPipe],
  templateUrl: './status-filter.component.html',
  styleUrls: ['./status-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusFilterComponent {
  filterStatuses = model.required<Status[]>()

  statuses = Object.values(Status)
    .filter((s) => s !== Status.FAILED_ALLOW_FAILURE)
    .sort()

  onChange(checked: boolean, status: Status): void {
    const selected = this.filterStatuses()
    if (checked) {
      this.filterStatuses.set([...selected, status])
    } else {
      this.filterStatuses.set(selected.filter((s) => s !== status))
    }
  }
}
