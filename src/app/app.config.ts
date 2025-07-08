import { GroupTabsComponent } from '$groups/group-tabs/group-tabs.component'
import { registerLocaleData } from '@angular/common'
import { provideHttpClient } from '@angular/common/http'
import en from '@angular/common/locales/en'
import nl from '@angular/common/locales/nl'
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZonelessChangeDetection
} from '@angular/core'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { Route, provideRouter, withHashLocation } from '@angular/router'
import { NzI18nService, en_US, nl_NL } from 'ng-zorro-antd/i18n'

registerLocaleData(en)
registerLocaleData(nl)

const routes: Route[] = [
  { path: '', component: GroupTabsComponent },
  { path: ':groupId', component: GroupTabsComponent },
  { path: ':groupId/:featureId', component: GroupTabsComponent },
  { path: '**', redirectTo: '' }
]

export const appConfig: ApplicationConfig = {
  providers: [
    provideNoopAnimations(),
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideRouter(routes, withHashLocation()),
    provideI18n()
  ]
}

function provideI18n() {
  return provideAppInitializer(() => {
    const i18n = inject(NzI18nService)
    if (navigator.languages.includes('nl')) {
      i18n.setLocale(nl_NL)
    } else {
      i18n.setLocale(en_US)
    }
  })
}
