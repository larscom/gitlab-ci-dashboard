import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'

import { Component } from '@angular/core'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { map } from 'rxjs'

@Component({
  selector: 'gcd-header',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzButtonModule, NzToolTipModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  version$ = this.http.get(`${location.origin}/api/version`, { responseType: 'text' }).pipe(
    map((v) => {
      const parts = v.split('@')
      return parts.length > 1 ? `${parts[0].slice(0, 7)}@${parts[1]}` : v
    })
  )

  constructor(private http: HttpClient) {}

  onClick(): void {
    window.open('https://github.com/larscom/gitlab-ci-dashboard', '_blank')
  }
}
