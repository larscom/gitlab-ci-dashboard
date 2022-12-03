import { CommonModule } from '@angular/common'
import { HttpClient, HttpClientModule } from '@angular/common/http'
import { NgModule, Optional, SkipSelf } from '@angular/core'
import { MatIconModule, MatIconRegistry } from '@angular/material/icon'
import { DomSanitizer } from '@angular/platform-browser'
import { ComponentsModule } from './components/components.module'

@NgModule({
  imports: [CommonModule, HttpClientModule, MatIconModule],
  exports: [ComponentsModule],
})
export class CoreModule {
  constructor(
    private readonly matIconRegistry: MatIconRegistry,
    private readonly domSanitizer: DomSanitizer,
    private readonly http: HttpClient,
    @Optional() @SkipSelf() readonly coreModule?: CoreModule
  ) {
    if (coreModule) {
      throw new TypeError('CoreModule can only be imported once.')
    }
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
