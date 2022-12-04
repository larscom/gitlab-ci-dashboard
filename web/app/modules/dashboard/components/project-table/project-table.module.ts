import { MaterialModule } from '@/shared/material.module'
import { PipesModule } from '@/shared/pipes/pipes.module'
import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { ProjectTableComponent } from './project-table.component'

@NgModule({
  declarations: [ProjectTableComponent],
  imports: [CommonModule, MaterialModule, PipesModule],
  exports: [ProjectTableComponent],
})
export class ProjectTableModule {}
