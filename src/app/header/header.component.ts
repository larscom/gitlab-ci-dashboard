import { CommonModule } from '@angular/common'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'

import { ConfigService } from '$service/config.service'
import { Component, inject } from '@angular/core'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'

@Component({
  selector: 'gcd-header',
  imports: [CommonModule, NzIconModule, NzButtonModule, NzToolTipModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  private config = inject(ConfigService)
  readonly version = this.config.version

  onClick(): void {
    window.open('https://github.com/larscom/gitlab-ci-dashboard', '_blank')
  }
}
