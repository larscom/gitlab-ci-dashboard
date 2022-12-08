import { Component } from '@angular/core'

@Component({
  selector: 'gcd-dashboard-page',
  template: `
    <gcd-search-filter></gcd-search-filter>
    <gcd-group-tabs></gcd-group-tabs>
  `,
})
export class DashboardPage {}
