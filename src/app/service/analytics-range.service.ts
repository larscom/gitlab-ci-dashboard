import { Injectable, computed, effect, inject, signal } from '@angular/core'
import { ConfigService } from './config.service'

export interface AnalyticsRange {
  hours: number
  label: string
}

const STORAGE_KEY = 'analytics_range_hours'
const ranges: AnalyticsRange[] = [
  { hours: 1, label: 'Last 1 hour' },
  { hours: 6, label: 'Last 6 hours' },
  { hours: 12, label: 'Last 12 hours' },
  { hours: 24, label: 'Last 24 hours' },
  { hours: 24 * 7, label: 'Last 7 days' },
  { hours: 24 * 14, label: 'Last 14 days' },
  { hours: 24 * 30, label: 'Last 30 days' },
  { hours: 24 * 60, label: 'Last 60 days' },
  { hours: 24 * 90, label: 'Last 90 days' }
]

@Injectable({ providedIn: 'root' })
export class AnalyticsRangeService {
  private config = inject(ConfigService)

  readonly hours = signal(this.load())
  readonly maximumHours = computed(() => Math.max(24, this.config.pipelineHistoryDays() * 24))
  readonly options = computed(() => {
    const maximum = this.maximumHours()
    const available = ranges.filter(({ hours }) => hours <= maximum)
    if (!available.some(({ hours }) => hours === maximum)) {
      available.push({ hours: maximum, label: `Last ${this.config.pipelineHistoryDays()} days` })
    }
    return available
  })
  readonly label = computed(() => this.options().find(({ hours }) => hours === this.hours())?.label ?? 'Custom range')

  constructor() {
    effect(() => {
      const maximum = this.maximumHours()
      if (this.hours() > maximum) this.set(maximum)
    })
  }

  set(hours: number): void {
    const normalized = Math.min(Math.max(1, hours), this.maximumHours())
    this.hours.set(normalized)
    try {
      localStorage.setItem(STORAGE_KEY, String(normalized))
    } catch {}
  }

  private load(): number {
    try {
      const stored = Number(localStorage.getItem(STORAGE_KEY))
      return Number.isFinite(stored) && stored > 0 ? stored : 24
    } catch {
      return 24
    }
  }
}
