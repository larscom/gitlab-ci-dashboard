import { ErrorService } from '$service/error.service'
import { AuthService } from '$service/auth.service'
import { ThemeService } from '$service/theme.service'

import { Component, computed, inject } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { NzAlertModule } from 'ng-zorro-antd/alert'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { HeaderComponent } from './header/header.component'
import { LoginComponent } from './login/login.component'
import { NzSpinModule } from 'ng-zorro-antd/spin'

@Component({
  selector: 'gcd-root',
  imports: [RouterOutlet, HeaderComponent, LoginComponent, NzAlertModule, NzButtonModule, NzSpinModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  errorService = inject(ErrorService)
  auth = inject(AuthService)
  private theme = inject(ThemeService)

  error = this.errorService.error

  get title() {
    return computed(() => {
      const error = this.error()
      if (!error) return ''

      const { statusCode } = error
      return `Error ${statusCode}`
    })
  }

  get message() {
    return computed(() => {
      const error = this.error()
      return error ? error.message : ''
    })
  }

  onClick(): void {
    window.location.reload()
  }
}
