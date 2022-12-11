import { Component } from '@angular/core'

@Component({
  selector: 'gcd-group-overview',
  template: `
    <gcd-group-filter></gcd-group-filter>
    <gcd-group-tabs></gcd-group-tabs>
  `,
})
export class GroupOverviewComponent {}
