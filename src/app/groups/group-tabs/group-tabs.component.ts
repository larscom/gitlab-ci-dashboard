import { Group, GroupId } from '$groups/model/group'
import { GroupService } from '$groups/service/group.service'
import { filterNotNull } from '$groups/util/filter'

import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core'
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router } from '@angular/router'
import { NzAlertModule } from 'ng-zorro-antd/alert'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { finalize, map } from 'rxjs'
import { FeatureTabsComponent } from './feature-tabs/feature-tabs.component'
import { ProjectId } from '$groups/model/project'

@Component({
  selector: 'gcd-group-tabs',
  imports: [
    NzAlertModule,
    NzButtonModule,
    NzSpinModule,
    FeatureTabsComponent
  ],
  templateUrl: './group-tabs.component.html',
  styleUrls: ['./group-tabs.component.scss']
})
export class GroupTabsComponent {
  private groupService = inject(GroupService)
  private destroyRef = inject(DestroyRef)

  groups = signal<Group[]>([])
  readonly emptyGroupMap = new Map<GroupId, Set<ProjectId>>()
  loading = signal(false)

  selectedGroupId = signal<number | undefined>(undefined)
  selectedIndex = computed(() => {
    const selectedGroupId = this.selectedGroupId()
    const groups = this.groups()
    return groups.findIndex(({ id }) => id === selectedGroupId)
  })
  selectedGroup = computed(() => this.groups().find(({ id }) => id === this.selectedGroupId()))
  selectedGroupMap = computed(() => {
    const group = this.selectedGroup()
    return group ? new Map<GroupId, Set<ProjectId>>([[group.id, new Set()]]) : this.emptyGroupMap
  })

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.loadGroups(false)

    effect(() => {
      if (this.selectedIndex() === -1) {
        this.onChange({ index: 0 })
      }
    })

    const groupId = toSignal(
      this.route.paramMap.pipe(
        takeUntilDestroyed(this.destroyRef),
        map((map) => map.get('groupId')),
        filterNotNull,
        map(Number)
      )
    )

    effect(() => {
      const groups = this.groups()
      const gid = groupId()
      if (gid) {
        if (groups.length > 0 && !groups.map(({ id }) => id).includes(gid)) {
          this.nagivate(groups[0].id)
        } else {
          this.selectedGroupId.set(gid)
        }
      }
    })
  }

  onReload(): void {
    window.location.reload()
  }

  onEnvironmentsChanged(): void {
    this.loadGroups(true)
  }

  onChange({ index }: { index: number }): void {
    const groups = this.groups()
    if (groups.length > 0) {
      const { id } = groups.at(index)!
      this.nagivate(id)
    }
  }

  private nagivate(groupId: GroupId): void {
    const featureId = this.route.snapshot.params['featureId'] ?? 'latest-pipelines'
    this.router.navigate([groupId, featureId])
  }

  private loadGroups(selectFirst: boolean): void {
    this.loading.set(true)
    this.groupService
      .getGroups()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((groups) => {
        this.groups.set(groups)
        if (selectFirst && groups.length > 0) {
          this.nagivate(groups[0].id)
        }
      })
  }
}
