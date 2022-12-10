import { GroupService } from '@/modules/dashboard/services/group.service'
import { Component, OnDestroy, OnInit } from '@angular/core'
import { FormControl } from '@angular/forms'
import { MatChipListboxChange } from '@angular/material/chips'
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  Subject,
  takeUntil,
} from 'rxjs'
import { ProjectService } from '../../services/project.service'

@Component({
  selector: 'gcd-search-filter',
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.scss'],
})
export class SearchFilterComponent implements OnInit, OnDestroy {
  readonly searchGroups = new FormControl('')
  readonly searchProjects = new FormControl('')

  readonly loading$ = combineLatest([
    this.groupService.isLoading(),
    this.projectService.isLoading(),
  ]).pipe(map((values) => values.some((value) => value)))

  readonly topics$ = this.projectService.getTopics()

  private readonly destroy = new Subject<void>()

  constructor(
    private readonly groupService: GroupService,
    private readonly projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.searchGroups.valueChanges
      .pipe(takeUntil(this.destroy), debounceTime(200), distinctUntilChanged())
      .subscribe((value) => this.groupService.setFilterText(value!))

    this.searchProjects.valueChanges
      .pipe(takeUntil(this.destroy), debounceTime(200), distinctUntilChanged())
      .subscribe((value) => this.projectService.setFilterText(value!))
  }

  ngOnDestroy(): void {
    this.destroy.next()
    this.destroy.complete()
  }

  onTopicsChange({ value: topics }: MatChipListboxChange): void {
    this.projectService.setFilterTopics(topics)
  }
}
