import { Component } from '@angular/core'
import { GroupTabsComponent } from './groups/group-tabs/group-tabs.component'
import { HeaderComponent } from './header/header.component'

@Component({
  selector: 'gcd-root',
  standalone: true,
  imports: [HeaderComponent, GroupTabsComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {}
