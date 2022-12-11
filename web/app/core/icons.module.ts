import { MaterialModule } from '@shared/material.module'
import { HttpClient } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { MatIconRegistry } from '@angular/material/icon'
import { DomSanitizer } from '@angular/platform-browser'

@NgModule({
  imports: [MaterialModule],
})
export class IconsModule {
  constructor(
    private readonly matIconRegistry: MatIconRegistry,
    private readonly domSanitizer: DomSanitizer,
    private readonly http: HttpClient
  ) {
    this.registerSvgIcons()
  }

  private registerSvgIcons(): void {
    const basePath = './assets/image/status'
    this.http
      .get<string[]>(`${basePath}/status_icons.json`)
      .subscribe((icons) =>
        icons.forEach((name) =>
          this.registerSvgIcon(name, `${basePath}/${name}.svg`)
        )
      )
  }

  private registerSvgIcon(name: string, path: string): void {
    this.matIconRegistry.addSvgIcon(
      name,
      this.domSanitizer.bypassSecurityTrustResourceUrl(path)
    )
  }
}
