import { Component } from '@angular/core'
import { FormControl } from '@angular/forms'
import { debounceTime, distinctUntilChanged, startWith, switchMap } from 'rxjs'
import { GroupService } from './services/group.service'

@Component({
  selector: 'gcd-dashboard-page',
  template: `
    <h1>Groups</h1>
    <mat-form-field appearance="outline">
      <input
        type="text"
        [formControl]="search"
        placeholder="Search Groups..."
        matInput
      />
    </mat-form-field>
    <gcd-group-tabs [groups]="(groups$ | async)!"></gcd-group-tabs>
  `,
})
export class DashboardPage {
  readonly search = new FormControl('')
  readonly groups$ = this.search.valueChanges.pipe(
    startWith(this.search.value),
    debounceTime(200),
    distinctUntilChanged(),
    switchMap((query) => this.groupService.search(query!))
  )

  constructor(private readonly groupService: GroupService) {
    groupService.fetchGroups().subscribe()
  }
}
