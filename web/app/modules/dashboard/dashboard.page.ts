import { Component } from '@angular/core'

@Component({
  selector: 'gcd-dashboard-page',
  template: `
    <gcd-group-filter></gcd-group-filter>
    <gcd-group-tabs></gcd-group-tabs>
  `,
})
export class DashboardPage {}
