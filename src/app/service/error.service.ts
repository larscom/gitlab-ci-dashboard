import { Injectable, signal } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private e = signal<string | null>(null)

  readonly error = this.e.asReadonly()

  setError(message: string): void {
    this.e.set(message)
  }
}
