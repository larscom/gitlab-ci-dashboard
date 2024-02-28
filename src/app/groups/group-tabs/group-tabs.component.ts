import { Group, GroupId } from '$groups/model/group'
import { GroupStore } from '$groups/store/group.store'
import { filterNotNull } from '$groups/util/filter'
import { CommonModule } from '@angular/common'
import { Component, DestroyRef, computed, effect, inject } from '@angular/core'
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router } from '@angular/router'
import { NzAlertModule } from 'ng-zorro-antd/alert'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTabChangeEvent, NzTabsModule } from 'ng-zorro-antd/tabs'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { map } from 'rxjs'
import { FeatureTabsComponent } from './feature-tabs/feature-tabs.component'
import { MaxLengthPipe } from './feature-tabs/pipes/max-length.pipe'

@Component({
  selector: 'gcd-group-tabs',
  standalone: true,
  imports: [
    CommonModule,
    NzAlertModule,
    NzButtonModule,
    NzTabsModule,
    NzSpinModule,
    NzToolTipModule,
    FeatureTabsComponent,
    MaxLengthPipe
  ],
  templateUrl: './group-tabs.component.html',
  styleUrls: ['./group-tabs.component.scss']
})
export class GroupTabsComponent {
  private groupStore = inject(GroupStore)
  private destroyRef = inject(DestroyRef)

  groupsLoading = this.groupStore.loading

  groups = this.groupStore.groups
  selectedGroupId = this.groupStore.selectedGroupId

  selectedIndex = computed(() => {
    const selectedGroupId = this.groupStore.selectedGroupId()
    const groups = this.groups()
    return groups.findIndex(({ id }) => id === selectedGroupId)
  })

  constructor(private route: ActivatedRoute, private router: Router) {
    effect(() => {
      if (this.selectedIndex() === -1) {
        this.onChange({ index: 0, tab: null })
      }
    })
    const id = toSignal(
      this.route.paramMap.pipe(
        takeUntilDestroyed(this.destroyRef),
        map((map) => map.get('groupId')),
        filterNotNull,
        map(Number)
      )
    )
    effect(
      () => {
        const groupId = id()
        const groups = this.groups()
        if (groupId) {
          if (groups.length > 0 && !groups.map(({ id }) => id).includes(groupId)) {
            this.nagivate(groups[0].id)
          } else {
            this.groupStore.selectGroupId(groupId)
          }
        }
      },
      { allowSignalWrites: true }
    )

    this.groupStore.fetch()
  }

  OnReload(): void {
    window.location.reload()
  }

  onChange({ index }: NzTabChangeEvent): void {
    const groups = this.groups()
    if (groups.length > 0) {
      const { id } = groups.at(index!)!
      this.nagivate(id)
    }
  }

  trackById(_: number, { id }: Group): GroupId {
    return id
  }

  private nagivate(groupId: GroupId): void {
    const featureId = this.route.snapshot.params['featureId'] ?? 'latest-pipelines'
    this.router.navigate([groupId, featureId])
  }
}
