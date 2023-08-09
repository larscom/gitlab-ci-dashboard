import { GroupId } from '$groups/model/group'
import { ProjectId } from '$groups/model/project'
import { UIStore } from '$store/ui.store'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzSelectModule } from 'ng-zorro-antd/select'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { Subscription } from 'rxjs'

@Component({
  selector: 'gcd-auto-refresh',
  standalone: true,
  imports: [CommonModule, NzSelectModule, NzToolTipModule, NzIconModule, NzButtonModule, FormsModule],
  templateUrl: './auto-refresh.component.html',
  styleUrls: ['./auto-refresh.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutoRefreshComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) id!: GroupId | ProjectId
  @Input() loading = false
  @Output() refresh = new EventEmitter<void>()

  intervalSeconds = ''

  intervalRef?: NodeJS.Timer
  subscription?: Subscription

  constructor(private uiStore: UIStore) {}

  ngOnChanges({ id }: SimpleChanges): void {
    if (!id) return

    this.subscription?.unsubscribe()
    this.subscription = this.uiStore.autoRefreshInterval(this.id).subscribe((interval) => {
      this.intervalSeconds = interval
      this.setupInterval()
    })
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalRef)
    this.subscription?.unsubscribe()
  }

  onClick(): void {
    this.setupInterval()
    this.refresh.next()
  }

  onChange(): void {
    this.refresh.next()
    this.uiStore.setAutoRefreshInterval(this.id, this.intervalSeconds)
  }

  private setupInterval(): void {
    clearInterval(this.intervalRef)
    if (this.intervalSeconds) {
      this.intervalRef = setInterval(() => !this.loading && this.refresh.next(), Number(this.intervalSeconds) * 1000)
    }
  }
}
