import { MaterialModule } from '@/shared/material.module'
import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { HeaderComponent } from './header/header.component'

@NgModule({
  declarations: [HeaderComponent],
  imports: [CommonModule, MaterialModule],
  exports: [HeaderComponent],
})
export class ComponentsModule {}
