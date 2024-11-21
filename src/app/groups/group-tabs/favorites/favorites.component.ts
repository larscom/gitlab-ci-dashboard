import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzDrawerModule } from 'ng-zorro-antd/drawer'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm'
import { FeatureTabsComponent } from '../feature-tabs/feature-tabs.component'
import { FavoriteService } from './favorite.service'
import { NzEmptyModule } from 'ng-zorro-antd/empty'

@Component({
  selector: 'gcd-favorites',
  imports: [
    CommonModule,
    NzDrawerModule,
    NzEmptyModule,
    NzPopconfirmModule,
    NzIconModule,
    NzButtonModule,
    FeatureTabsComponent
  ],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FavoritesComponent {
  private favoriteService = inject(FavoriteService)

  close = output()

  favorites = this.favoriteService.favorites

  hasFavorites = computed(() => Array.from(this.favorites().values()).some((ids) => ids.size > 0))

  onConfirm() {
    this.favoriteService.removeAll()
  }
}
