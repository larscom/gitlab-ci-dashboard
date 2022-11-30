import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { MatTableModule } from '@angular/material/table'
import { ProjectTableComponent } from './project-table.component'

@NgModule({
  declarations: [ProjectTableComponent],
  imports: [CommonModule, MatTableModule],
  exports: [ProjectTableComponent],
})
export class ProjectTableModule {}
