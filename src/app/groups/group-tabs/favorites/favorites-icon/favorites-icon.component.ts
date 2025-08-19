import { GroupId } from '$groups/model/group'
import { ProjectId } from '$groups/model/project'
import { CommonModule } from '@angular/common'
import { Component, computed, inject, input, signal } from '@angular/core'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTooltipModule } from 'ng-zorro-antd/tooltip'
import { FavoriteService } from '../favorite.service'

@Component({
  selector: 'gcd-favorites-icon',
  imports: [CommonModule, NzTooltipModule, NzIconModule, NzButtonModule],
  templateUrl: './favorites-icon.component.html',
  styleUrls: ['./favorites-icon.component.scss']
})
export class FavoritesIconComponent {
  private favoriteService = inject(FavoriteService)

  groupId = input.required<GroupId>()
  projectId = input.required<ProjectId>()

  tooltipTitle = computed(() => {
    return this.hasFavorite() ? 'Remove from favorites' : 'Add to favorites'
  })

  remove(e: Event) {
    e.stopPropagation()

    this.favoriteService.removeProject(this.groupId(), this.projectId())
  }

  add(e: Event) {
    e.stopPropagation()

    this.favoriteService.addProject(this.groupId(), this.projectId())
  }

  get hasFavorite() {
    return this.favoriteService.anyProject(this.groupId(), this.projectId())
  }
}
