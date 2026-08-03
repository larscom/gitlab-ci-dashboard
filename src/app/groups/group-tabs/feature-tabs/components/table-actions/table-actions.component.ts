import { ChangeDetectionStrategy, Component } from '@angular/core'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzDropDownModule } from 'ng-zorro-antd/dropdown'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTooltipModule } from 'ng-zorro-antd/tooltip'

@Component({
  selector: 'gcd-table-actions',
  imports: [NzButtonModule, NzDropDownModule, NzIconModule, NzTooltipModule],
  templateUrl: './table-actions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableActionsComponent {
  stopPropagation(event: Event): void {
    event.stopPropagation()
  }
}
