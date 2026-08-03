import { Runner, RunnerWithJobs } from '$groups/model/runner'
import { compareString } from '$groups/util/compare'
import { Header } from '$groups/util/table'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core'
import { NzResizableModule, NzResizeEvent } from 'ng-zorro-antd/resizable'
import { NzSelectModule } from 'ng-zorro-antd/select'
import { NzTableComponent, NzTableModule } from 'ng-zorro-antd/table'
import { NzTagModule } from 'ng-zorro-antd/tag'
import { TablePaginatorDirective } from '../../directives/table-paginator.directive'

interface ResizableHeader extends Header<RunnerWithJobs> {
  width: number
}

const headers: ResizableHeader[] = [
  {
    title: 'Tags',
    width: 320,
    sortable: true,
    compare: (a, b) => compareString(a.runner.tag_list.join(','), b.runner.tag_list.join(','))
  },
  {
    title: 'Type',
    width: 190,
    sortable: true,
    compare: (a, b) => compareString(a.runner.runner_type, b.runner.runner_type)
  },
  {
    title: 'Group / Project',
    width: 320,
    sortable: true,
    compare: (a, b) => compareString(runnerScope(a.runner), runnerScope(b.runner))
  },
  {
    title: 'Address',
    width: 190,
    sortable: true,
    compare: (a, b) => compareString(a.runner.ip_address, b.runner.ip_address)
  },
  {
    title: 'Runner',
    width: 220,
    sortable: true,
    compare: (a, b) => compareString(a.runner.description, b.runner.description)
  },
  {
    title: 'Status',
    width: 130,
    sortable: true,
    compare: (a, b) => compareString(runnerStatus(a.runner), runnerStatus(b.runner))
  }
]

@Component({
  selector: 'gcd-runner-table',
  imports: [CommonModule, FormsModule, NzResizableModule, NzSelectModule, NzTableModule, NzTagModule, TablePaginatorDirective],
  templateUrl: './runner-table.component.html',
  styleUrls: ['./runner-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RunnerTableComponent {
  runners = input.required<RunnerWithJobs[]>()
  headers = headers
  jobsWidth = 900
  pageIndex = signal(1)
  readonly pageSizeOptions = [10, 20, 30, 40, 50, 100]
  readonly allPageSize = 1_000_000_000

  get widthConfig(): string[] {
    return [...this.headers.map(({ width }) => `${width}px`), `${this.jobsWidth}px`]
  }

  get tableWidth(): number {
    return this.headers.reduce((total, { width }) => total + width, this.jobsWidth)
  }

  status(runner: Runner): string {
    return runnerStatus(runner)
  }

  statusColor(runner: Runner): string {
    const status = runnerStatus(runner)
    if (status === 'running') return '#22c55e'
    if (status === 'idle') return '#3b82f6'
    if (status === 'paused') return '#f59e0b'
    if (status === 'stale' || status === 'offline') return '#ef4444'
    return '#8b9298'
  }

  runnerType(type: string): string {
    return type.replace(/_type$/, '').replace('_', ' ')
  }

  runnerScope(runner: Runner): string {
    return runnerScope(runner)
  }

  onHeaderResize({ width }: NzResizeEvent, header: ResizableHeader): void {
    if (width) header.width = width
  }

  onJobsResize({ width }: NzResizeEvent): void {
    if (width) this.jobsWidth = width
  }

  pageCount(total:number,pageSize:number){return Math.max(1,Math.ceil(total/pageSize))}

  rangeStart(total: number, pageSize: number): number {
    return total ? (this.pageIndex() - 1) * pageSize + 1 : 0
  }

  rangeEnd(total: number, pageSize: number): number {
    return Math.min(this.pageIndex() * pageSize, total)
  }

  changePageSize(table: NzTableComponent<RunnerWithJobs>, pageSize: number): void {
    table.onPageSizeChange(pageSize)
    this.pageIndex.set(1)
  }
}

function runnerScope(runner: Runner): string {
  if (runner.runner_type === 'project_type' && runner.projects.length) {
    return runner.projects.map(({ path_with_namespace, name }) => path_with_namespace || name).join(', ')
  }
  return runner.scope_name || '-'
}

function runnerStatus(runner: Runner): string {
  if (runner.paused) return 'paused'
  if (runner.job_execution_status === 'running' || runner.job_execution_status === 'active') return 'running'
  if (runner.online && runner.job_execution_status === 'idle') return 'idle'
  return runner.status || (runner.online ? 'online' : 'offline')
}
