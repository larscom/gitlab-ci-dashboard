import { ErrorService } from '$service/error.service'

import { Component, computed, inject } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { NzAlertModule } from 'ng-zorro-antd/alert'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { GroupTabsComponent } from './groups/group-tabs/group-tabs.component'
import { HeaderComponent } from './header/header.component'

@Component({
  selector: 'gcd-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, GroupTabsComponent, NzAlertModule, NzButtonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  errorService = inject(ErrorService)

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
