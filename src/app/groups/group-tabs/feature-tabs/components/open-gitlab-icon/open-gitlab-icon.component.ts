
import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTooltipModule } from 'ng-zorro-antd/tooltip'

@Component({
  selector: 'gcd-open-gitlab-icon',
  imports: [NzButtonModule, NzIconModule, NzTooltipModule],
  templateUrl: './open-gitlab-icon.component.html',
  styleUrls: ['./open-gitlab-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OpenGitlabIconComponent {
  url = input.required<string>()

  onClick(e: MouseEvent) {
    e.stopPropagation()
    window.open(this.url(), '_blank')
  }
}
