import { NgModule } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatChipsModule } from '@angular/material/chips'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatTableModule } from '@angular/material/table'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatTooltipModule } from '@angular/material/tooltip'

const modules = [
  MatButtonModule,
  MatChipsModule,
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
