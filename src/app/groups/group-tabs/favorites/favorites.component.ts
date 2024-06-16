import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core'
import { NzDrawerModule } from 'ng-zorro-antd/drawer'
import { FeatureTabsComponent } from '../feature-tabs/feature-tabs.component'
import { FavoriteService } from './favorite.service'

@Component({
  selector: 'gcd-favorites',
  standalone: true,
  imports: [CommonModule, NzDrawerModule, FeatureTabsComponent],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FavoritesComponent {
  private favoriteService = inject(FavoriteService)

  close = output()

  get favorites() {
    return this.favoriteService.favorites
  }
}
