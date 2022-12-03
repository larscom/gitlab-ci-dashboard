import { NgModule } from '@angular/core'
import { DisplayTimePipe } from './display-time.pipe'

const pipes = [DisplayTimePipe]

@NgModule({ declarations: pipes, exports: pipes })
export class PipesModule {}
