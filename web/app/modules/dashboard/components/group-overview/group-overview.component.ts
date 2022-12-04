import { GroupService } from '@/modules/dashboard/services/group.service'
import { Component } from '@angular/core'
import { FormControl } from '@angular/forms'
import { debounceTime, distinctUntilChanged, startWith, switchMap } from 'rxjs'

@Component({
  selector: 'gcd-group-overview',
  templateUrl: './group-overview.component.html',
  styleUrls: ['./group-overview.component.scss'],
})
export class GroupOverviewComponent {
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
