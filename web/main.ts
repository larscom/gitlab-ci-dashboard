import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'

import { AppModule } from './app/app.module'
import { devTools } from '@ngneat/elf-devtools'

devTools()

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err))
