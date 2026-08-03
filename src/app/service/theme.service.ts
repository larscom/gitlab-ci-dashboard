import { HttpClient } from '@angular/common/http'
import { Injectable, effect, inject, signal } from '@angular/core'
import { AuthService } from './auth.service'

const STORAGE_KEY = 'theme'
const DRACULA_THEME = 'dracula'

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private http = inject(HttpClient)
  private auth = inject(AuthService)
  isDracula = signal(this.getSavedTheme() === DRACULA_THEME)
  private loadedUser = ''

  constructor() {
    this.applyTheme()
    effect(() => {
      const username = this.auth.authenticated() ? this.auth.username() : ''
      if (!username || username === this.loadedUser) return
      this.loadedUser = username
      this.http.get<{theme:'light'|'dracula'}>('api/preferences').subscribe(({theme}) => {
        this.isDracula.set(theme === DRACULA_THEME)
        this.saveLocalTheme()
        this.applyTheme()
      })
    })
  }

  toggle(): void {
    this.isDracula.update((enabled) => !enabled)
    const theme = this.isDracula() ? DRACULA_THEME : 'light'
    this.saveLocalTheme()
    this.applyTheme()
    if (this.auth.authenticated()) this.http.put('api/preferences/theme', { theme }).subscribe()
  }

  private applyTheme(): void {
    document.documentElement.classList.toggle('dracula-theme', this.isDracula())
  }

  private getSavedTheme(): string {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? 'light'
    } catch {
      return 'light'
    }
  }

  private saveLocalTheme(): void {
    try { localStorage.setItem(STORAGE_KEY, this.isDracula() ? DRACULA_THEME : 'light') } catch {}
  }
}
