import { CommonModule } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'
import { NgModule, Optional, SkipSelf } from '@angular/core'
import { ComponentsModule } from './components/components.module'
import { IconsModule } from './icons.module'

@NgModule({
  imports: [CommonModule, HttpClientModule, IconsModule],
  exports: [ComponentsModule],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() readonly coreModule?: CoreModule) {
    if (coreModule) {
      throw new TypeError('CoreModule can only be imported once.')
    }
  }
}
