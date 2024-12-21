import { Job, JobId } from '$groups/model/job'
import { PipelineId } from '$groups/model/pipeline'
import { ProjectId } from '$groups/model/project'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { ChangeDetectionStrategy, Component, inject, Injector, input, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzDropDownModule } from 'ng-zorro-antd/dropdown'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzSpaceModule } from 'ng-zorro-antd/space'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { combineLatest, switchMap } from 'rxjs'
import { StatusColorPipe } from '../../pipes/status-color.pipe'
import FileSaver from 'file-saver'

@Component({
  selector: 'gcd-download-artifacts-icon',
  imports: [
    CommonModule,
    NzSpaceModule,
    NzButtonModule,
    NzIconModule,
    NzDropDownModule,
    NzToolTipModule,
    StatusColorPipe
  ],
  templateUrl: './download-artifacts-icon.component.html',
  styleUrls: ['./download-artifacts-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DownloadArtifactsIconComponent {
  private http = inject(HttpClient)
  private injector = inject(Injector)

  projectId = input.required<ProjectId>()
  pipelineId = input.required<PipelineId>()

  loading = signal(false)

  jobs = toSignal(
    combineLatest([
      toObservable(this.projectId, { injector: this.injector }),
      toObservable(this.pipelineId, { injector: this.injector })
    ]).pipe(
      switchMap(([projectId, pipelineId]) => {
        const params = {
          project_id: projectId,
          pipeline_id: pipelineId,
          scope: ''
        }

        return this.http.get<Job[]>('/api/jobs', { params })
      })
    ),
    { initialValue: [] }
  )

  download({ id, name }: Job) {
    const params = {
      project_id: this.projectId(),
      job_id: id
    }

    this.loading.set(true)

    this.http.get('/api/artifacts', { params, responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.loading.set(false)
        FileSaver.saveAs(blob, `${name}_${id}.zip`)
      },
      error: (e) => {
        this.loading.set(false)
        console.error('error download file', e)
      }
    })
  }
}
