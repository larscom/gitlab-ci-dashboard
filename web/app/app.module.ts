import { NgModule } from '@angular/core'

import { BrowserModule } from '@angular/platform-browser'

import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { CoreModule } from './core/core.module'

const bootstrap = [AppComponent]

@NgModule({
  declarations: bootstrap,
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    CoreModule,
  ],
  bootstrap,
})
export class AppModule {}
