import { AuthService } from '$service/auth.service'
import { ThemeService } from '$service/theme.service'
import { HttpErrorResponse } from '@angular/common/http'
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzInputModule } from 'ng-zorro-antd/input'
import { NzTooltipModule } from 'ng-zorro-antd/tooltip'

@Component({
  selector: 'gcd-login',
  imports: [FormsModule, NzButtonModule, NzIconModule, NzInputModule, NzTooltipModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private auth = inject(AuthService)
  theme = inject(ThemeService)

  username = signal('')
  password = signal('')
  loading = signal(false)
  error = signal('')

  submit(): void {
    if (!this.username() || !this.password() || this.loading()) {
      return
    }

    this.loading.set(true)
    this.error.set('')
    this.auth.login(this.username(), this.password()).subscribe({
      next: () => this.loading.set(false),
      error: ({ error }: HttpErrorResponse) => {
        this.loading.set(false)
        this.error.set(error?.message ?? 'Unable to sign in')
      }
    })
  }
}
