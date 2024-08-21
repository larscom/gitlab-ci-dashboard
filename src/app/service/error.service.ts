import { GroupId } from '$groups/model/group'
import { Injectable, signal } from '@angular/core'

export interface ErrorContext {
  message: string
  statusCode: number
  groupId?: GroupId
}

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private _error = signal<ErrorContext | null>(null)

  readonly error = this._error.asReadonly()

  setError(context: ErrorContext): void {
    this._error.set(context)
  }
}
