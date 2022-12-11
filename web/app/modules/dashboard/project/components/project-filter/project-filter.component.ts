import { Component, OnDestroy, OnInit } from '@angular/core'
import { FormControl } from '@angular/forms'
import { MatChipListboxChange } from '@angular/material/chips'
import { ProjectService } from '@modules/dashboard/project/services/project.service'
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs'

@Component({
  selector: 'gcd-project-filter',
  templateUrl: './project-filter.component.html',
  styleUrls: ['./project-filter.component.scss'],
})
export class ProjectFilterComponent implements OnInit, OnDestroy {
  readonly search = new FormControl('')

  readonly loading$ = this.projectService.isLoading()
  readonly topics$ = this.projectService.getTopics()

  private readonly destroy = new Subject<void>()

  constructor(private readonly projectService: ProjectService) {}

  ngOnInit(): void {
    this.search.valueChanges
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
