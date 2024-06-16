import { GroupId } from '$groups/model/group'
import { ProjectId } from '$groups/model/project'
import { CommonModule } from '@angular/common'
import { Component, inject, input } from '@angular/core'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { FavoriteService } from '../favorite.service'

@Component({
  selector: 'gcd-favorites-icon',
  standalone: true,
  imports: [CommonModule, NzToolTipModule, NzIconModule, NzButtonModule],
  templateUrl: './favorites-icon.component.html',
  styleUrls: ['./favorites-icon.component.scss']
})
export class FavoritesIconComponent {
  private favoriteService = inject(FavoriteService)

  groupId = input.required<GroupId>()
  projectId = input.required<ProjectId>()

  removeFromFavorites(e: Event) {
    e.stopPropagation()

    this.favoriteService.remove(this.groupId(), this.projectId())
  }

  addToFavorites(e: Event) {
    e.stopPropagation()

    this.favoriteService.add(this.groupId(), this.projectId())
  }

  get hasFavorite() {
    return this.favoriteService.any(this.groupId(), this.projectId())
  }
}
