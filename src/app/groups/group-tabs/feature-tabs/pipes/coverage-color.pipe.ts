import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
  name: 'coverageColor',
  standalone: true
})
export class CoverageColorPipe implements PipeTransform {
  transform(coverage?: number): string {
    if (coverage === undefined) {
      return 'inherit'
    }

    const cov = Math.max(0, Math.min(100, coverage))

    if (cov < 50) {
      return '#FA5252'
    } else if (cov < 80) {
      return '#FD7E14'
    } else {
      return '#087F5B'
    }
  }
}
