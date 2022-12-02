import { HttpClient } from '@angular/common/http'
import { Component } from '@angular/core'

@Component({
  selector: 'gcd-header',
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  readonly version$ = this.http.get(`${location.origin}/api/version`, {
    responseType: 'text',
  })

  constructor(private readonly http: HttpClient) {}

  openGithub(): void {
    window.open('https://github.com/larscom/gitlab-ci-dashboard', '_blank')
  }
}
