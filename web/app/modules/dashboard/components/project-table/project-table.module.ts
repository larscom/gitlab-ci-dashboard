import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { MatTableModule } from '@angular/material/table'
import { PipesModule } from '@/shared/pipes/pipes.module'
import { ProjectTableComponent } from './project-table.component'

@NgModule({
  declarations: [ProjectTableComponent],
  imports: [CommonModule, MatTableModule, PipesModule],
  exports: [ProjectTableComponent],
})
export class ProjectTableModule {}
