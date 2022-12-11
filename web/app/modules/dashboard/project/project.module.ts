import { PipesModule } from '@app/shared/pipes/pipes.module'
import { MaterialModule } from '@shared/material.module'
import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { ProjectFilterComponent } from './components/project-filter/project-filter.component'
import { ProjectTableComponent } from './components/project-table/project-table.component'
import { ProjectService } from './services/project.service'
import { ProjectStore } from './store/project-store'

@NgModule({
  declarations: [ProjectTableComponent, ProjectFilterComponent],
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, PipesModule],
  providers: [ProjectStore, ProjectService],
  exports: [ProjectTableComponent, ProjectFilterComponent],
})
export class ProjectModule {}
