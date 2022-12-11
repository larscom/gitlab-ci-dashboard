import { Component, OnDestroy, OnInit } from '@angular/core'
import { FormControl } from '@angular/forms'
import { GroupService } from '@modules/dashboard/group/services/group.service'
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs'

@Component({
  selector: 'gcd-group-filter',
  templateUrl: './group-filter.component.html',
  styleUrls: ['./group-filter.component.scss'],
})
export class GroupFilterComponent implements OnInit, OnDestroy {
  readonly search = new FormControl('')

  readonly loading$ = this.groupService.isLoading()

  private readonly destroy = new Subject<void>()

  constructor(private readonly groupService: GroupService) {}

  ngOnInit(): void {
    this.search.valueChanges
      .pipe(takeUntil(this.destroy), debounceTime(200), distinctUntilChanged())
      .subscribe((value) => this.groupService.setFilterText(value!))
  }

  ngOnDestroy(): void {
    this.destroy.next()
    this.destroy.complete()
  }
}
