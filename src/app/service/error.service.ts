import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private error = new BehaviorSubject<string | null>(null)

  readonly error$ = this.error.asObservable()

  setError(message: string): void {
    this.error.next(message)
  }
}
