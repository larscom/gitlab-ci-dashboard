import { registerLocaleData } from '@angular/common'
import { provideHttpClient } from '@angular/common/http'
import { APP_INITIALIZER, ApplicationConfig, Provider } from '@angular/core'
import { provideAnimations } from '@angular/platform-browser/animations'
import { Actions, provideEffects, provideEffectsManager } from '@ngneat/effects-ng'

import { devTools } from '@ngneat/elf-devtools'
import { NzI18nService, en_US, nl_NL } from 'ng-zorro-antd/i18n'
import { GroupEffects } from './groups/store/group.effects'

import { LatestPipelineEffects } from '$groups/group-tabs/feature-tabs/latest-pipelines/store/latest-pipeline.effects'
import { PipelineEffects } from '$groups/group-tabs/feature-tabs/pipelines/store/pipeline.effects'
import { ScheduleEffects } from '$groups/group-tabs/feature-tabs/schedules/store/schedule.effects'
import { GroupTabsComponent } from '$groups/group-tabs/group-tabs.component'
import en from '@angular/common/locales/en'
import nl from '@angular/common/locales/nl'
import { Route, provideRouter, withHashLocation } from '@angular/router'

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
    provideDevtools('gitlab-ci-dashboard'),
    provideAnimations(),
    provideHttpClient(),
    provideEffectsManager(),
    provideRouter(routes, withHashLocation()),
    provideEffects(GroupEffects, LatestPipelineEffects, PipelineEffects, ScheduleEffects),
    provideI18n()
  ]
}

function provideDevtools(name: string): Provider {
  return {
    provide: APP_INITIALIZER,
    multi: true,
    useFactory: (actionsDispatcher: Actions) => {
      return () => devTools({ name, actionsDispatcher })
    },
    deps: [Actions]
  }
}

function provideI18n(): Provider {
  return {
    provide: APP_INITIALIZER,
    multi: true,
    useFactory: (i18n: NzI18nService) => {
      return () => {
        if (navigator.languages.includes('nl')) {
          i18n.setLocale(nl_NL)
        } else {
          i18n.setLocale(en_US)
        }
      }
    },
    deps: [NzI18nService]
  }
}
