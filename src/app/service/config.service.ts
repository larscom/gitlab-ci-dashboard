import { HttpClient } from '@angular/common/http'
import { computed, inject, Injectable } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'

export interface ApiConfig {
  api_version: string
  read_only: boolean
  hide_write_actions: boolean
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly config = toSignal(inject(HttpClient).get<ApiConfig>('/api/config'))

  readonly version = computed(() => {
    const version = this.config()?.api_version ?? ''
    const parts = version.split('@')
    return parts.length > 1 ? `${parts[0].slice(0, 7)}@${parts[1]}` : version
  })

  readonly readOnly = computed(() => this.config()?.read_only)

  readonly hideWriteActions = computed(() => this.readOnly() && this.config()?.hide_write_actions)
}
