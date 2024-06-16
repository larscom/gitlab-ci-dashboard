import { ErrorService } from '$service/error.service'

import { Component, inject } from '@angular/core'
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
  error = inject(ErrorService).error

  onClick(): void {
    window.location.reload()
  }
}
