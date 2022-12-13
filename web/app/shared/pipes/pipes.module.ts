import { NgModule } from '@angular/core'
import { ArrayToStringPipe } from './array-to-string.pipe'
import { FormatTimePipe } from './format-time.pipe'

const pipes = [ArrayToStringPipe, FormatTimePipe]

@NgModule({ declarations: pipes, exports: pipes })
export class PipesModule {}
