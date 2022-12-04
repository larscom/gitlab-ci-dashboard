import { NgModule } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatTableModule } from '@angular/material/table'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatInputModule } from '@angular/material/input'

const modules = [
  MatIconModule,
  MatTabsModule,
  MatTableModule,
  MatInputModule,
  MatToolbarModule,
  MatTooltipModule,
  MatProgressBarModule,
]

@NgModule({ exports: modules })
export class MaterialModule {}
