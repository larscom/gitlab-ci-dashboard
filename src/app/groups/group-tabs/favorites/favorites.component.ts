
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { PipelinesComponent } from '../feature-tabs/pipelines/pipelines.component'
import { FavoriteService } from './favorite.service'

@Component({
  selector: 'gcd-favorites',
  imports: [NzIconModule,PipelinesComponent],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FavoritesComponent {
  private favoriteService = inject(FavoriteService)
  groupId = input<number>()

  favorites = computed(() => {
    const groupId = this.groupId()
    if (groupId === undefined) return new Map()
    const projects = this.favoriteService.favorites().get(groupId)
    return projects ? new Map([[groupId, projects]]) : new Map()
  })

  hasFavorites = computed(() => Array.from(this.favorites().values()).some((ids) => ids.size > 0))
}
