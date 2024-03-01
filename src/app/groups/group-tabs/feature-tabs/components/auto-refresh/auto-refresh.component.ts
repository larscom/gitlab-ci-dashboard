import { GroupId } from '$groups/model/group'
import { ProjectId } from '$groups/model/project'
import { UIStore } from '$store/ui.store'

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Injector,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  inject,
  input,
  runInInjectionContext,
  signal
} from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzSelectModule } from 'ng-zorro-antd/select'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { Subscription } from 'rxjs'

@Component({
  selector: 'gcd-auto-refresh',
  standalone: true,
  imports: [NzSelectModule, NzToolTipModule, NzIconModule, NzButtonModule, FormsModule],
  templateUrl: './auto-refresh.component.html',
  styleUrls: ['./auto-refresh.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutoRefreshComponent implements OnChanges, OnDestroy {
  private intervalRef?: NodeJS.Timeout
  private subscription?: Subscription

  private uiStore = inject(UIStore)
  private injector = inject(Injector)

  id = input.required<GroupId | ProjectId>()
  loading = input.required<boolean>()

  @Output() refresh = new EventEmitter<void>()

  intervalSeconds = signal('')

  ngOnChanges({ id }: SimpleChanges): void {
    if (!id) return

    runInInjectionContext(this.injector, () => {
      this.subscription?.unsubscribe()
      this.subscription = toObservable(this.uiStore.getAutoRefreshInterval(this.id())).subscribe((interval) => {
        this.intervalSeconds.set(interval)
        this.setupInterval()
      })
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
    this.uiStore.setAutoRefreshInterval(this.id(), this.intervalSeconds())
  }

  private setupInterval(): void {
    clearInterval(this.intervalRef)
    if (this.intervalSeconds()) {
      this.intervalRef = setInterval(
        () => !this.loading() && this.refresh.next(),
        Number(this.intervalSeconds()) * 1000
      )
    }
  }
}
