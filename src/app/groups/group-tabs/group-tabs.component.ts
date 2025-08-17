import { Group, GroupId } from '$groups/model/group'
import { GroupService } from '$groups/service/group.service'
import { filterNotNull } from '$groups/util/filter'
import { CommonModule } from '@angular/common'
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core'
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router } from '@angular/router'
import { NzAlertModule } from 'ng-zorro-antd/alert'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTabChangeEvent, NzTabsModule } from 'ng-zorro-antd/tabs'
import { NzTooltipModule } from 'ng-zorro-antd/tooltip'
import { finalize, map } from 'rxjs'
import { FavoritesComponent } from './favorites/favorites.component'
import { FeatureTabsComponent } from './feature-tabs/feature-tabs.component'
import { MaxLengthPipe } from './feature-tabs/pipes/max-length.pipe'
import { ProjectId } from '$groups/model/project'

@Component({
  selector: 'gcd-group-tabs',
  imports: [
    CommonModule,
    NzAlertModule,
    NzButtonModule,
    NzTabsModule,
    NzSpinModule,
    NzTooltipModule,
    NzIconModule,
    FeatureTabsComponent,
    MaxLengthPipe,
    FavoritesComponent
  ],
  templateUrl: './group-tabs.component.html',
  styleUrls: ['./group-tabs.component.scss']
})
export class GroupTabsComponent {
  private groupService = inject(GroupService)
  private destroyRef = inject(DestroyRef)

  groups = signal<Group[]>([])
  loading = signal(false)

  showFavorites = signal(false)
  selectedGroupId = signal<number | undefined>(undefined)
  selectedIndex = computed(() => {
    const selectedGroupId = this.selectedGroupId()
    const groups = this.groups()
    return groups.findIndex(({ id }) => id === selectedGroupId)
  })

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.loading.set(true)
    this.groupService
      .getGroups()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((groups) => this.groups.set(groups))

    effect(() => {
      if (this.selectedIndex() === -1) {
        this.onChange({ index: 0, tab: null })
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

  toggleFavorites(): void {
    this.showFavorites.set(!this.showFavorites())
  }

  onReload(): void {
    window.location.reload()
  }

  onChange({ index }: NzTabChangeEvent): void {
    const groups = this.groups()
    if (groups.length > 0) {
      const { id } = groups.at(index!)!
      this.nagivate(id)
    }
  }

  trackById({ id }: Group): GroupId {
    return id
  }

  getGroupMap({ id }: Group): Map<GroupId, Set<ProjectId>> {
    return new Map([[id, new Set()]])
  }

  private nagivate(groupId: GroupId): void {
    const featureId = this.route.snapshot.params['featureId'] ?? 'latest-pipelines'
    this.router.navigate([groupId, featureId])
  }
}
