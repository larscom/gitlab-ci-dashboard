import { ErrorService } from '$service/alert.service'
import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { NzAlertModule } from 'ng-zorro-antd/alert'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { GroupTabsComponent } from './groups/group-tabs/group-tabs.component'
import { HeaderComponent } from './header/header.component'

@Component({
  selector: 'gcd-root',
  standalone: true,
  imports: [CommonModule, HeaderComponent, GroupTabsComponent, NzAlertModule, NzButtonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  error$ = this.errorService.error$

  constructor(private errorService: ErrorService) {}

  OnClick(): void {
    window.location.reload()
  }
}