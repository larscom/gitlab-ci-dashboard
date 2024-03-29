import { Status } from '$groups/model/status'
import { statusToColor } from '$groups/util/status-color'
import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
  name: 'statusColor',
  standalone: true
})
export class StatusColorPipe implements PipeTransform {
  transform(status?: Status | string): string {
    return statusToColor(status)
  }
}
