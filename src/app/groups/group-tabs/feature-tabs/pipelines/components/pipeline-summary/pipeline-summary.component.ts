import { StatusColorPipe } from '$groups/group-tabs/feature-tabs/pipes/status-color.pipe'
import { Status } from '$groups/model/status'
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core'

interface StatusSegment {
  status: Status
  count: number
  percentage: number
}

@Component({
  selector: 'gcd-pipeline-summary',
  imports: [StatusColorPipe],
  templateUrl: './pipeline-summary.component.html',
  styleUrls: ['./pipeline-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineSummaryComponent {
  statusCounts = input.required<ReadonlyMap<Status, number>>()
  hoverTooltip = signal<{ text: string; x: number; y: number } | null>(null)

  total = computed(() => Array.from(this.statusCounts().values()).reduce((total, count) => total + count, 0))

  segments = computed<StatusSegment[]>(() => {
    const total = this.total()
    if (total === 0) {
      return []
    }

    return Object.values(Status)
      .filter((status) => status !== Status.FAILED_ALLOW_FAILURE)
      .map((status) => {
        const count = this.statusCounts().get(status) ?? 0
        return { status, count, percentage: (count / total) * 100 }
      })
      .filter(({ count }) => count > 0)
      .sort((a, b) => b.count - a.count)
  })

  moveTooltip(event: PointerEvent, text: string): void {
    this.hoverTooltip.set({
      text,
      x: Math.min(event.clientX + 14, window.innerWidth - 130),
      y: Math.min(event.clientY + 14, window.innerHeight - 48)
    })
  }
}
