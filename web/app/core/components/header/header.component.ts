import { Component } from '@angular/core';

@Component({
  selector: 'gcd-header',
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  openGithub(): void {
    window.open('https://github.com/larscom/gitlab-ci-dashboard', '_blank');
  }
}
