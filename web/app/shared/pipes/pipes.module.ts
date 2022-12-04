import { NgModule } from '@angular/core'
import { FormatTimePipe } from './format-time.pipe'

const pipes = [FormatTimePipe]

@NgModule({ declarations: pipes, exports: pipes })
export class PipesModule {}
