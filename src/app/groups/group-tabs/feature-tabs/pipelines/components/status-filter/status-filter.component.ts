import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'

import { Status } from '$groups/model/pipeline'
import { FormsModule } from '@angular/forms'
import { NzSelectModule } from 'ng-zorro-antd/select'
import { NzTagModule } from 'ng-zorro-antd/tag'

@Component({
  selector: 'gcd-status-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, NzTagModule, NzSelectModule],
  templateUrl: './status-filter.component.html',
  styleUrls: ['./status-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusFilterComponent {
  @Input({ required: true }) selectedFilterStatuses: Status[] = []

  @Output() filterStatusesChanged = new EventEmitter<Status[]>()

  statuses = Object.values(Status).sort()

  onChange(checked: boolean, status: Status): void {
    const selected = this.selectedFilterStatuses
    if (checked) {
      this.filterStatusesChanged.next([...selected, status])
    } else {
      this.filterStatusesChanged.next(selected.filter((s) => s !== status))
    }
  }
}
