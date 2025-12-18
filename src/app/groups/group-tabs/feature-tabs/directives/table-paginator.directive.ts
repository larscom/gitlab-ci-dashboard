import { ConfigService } from '$service/config.service'
import { computed, DestroyRef, Directive, effect, inject, input, OnInit } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { NzTableComponent } from 'ng-zorro-antd/table'

const DEFAULT_KEY = 'tp'

@Directive({
  selector: 'nz-table[tablePaginator]'
})
export class TablePaginatorDirective implements OnInit {
  private destroyRef = inject(DestroyRef)
  private table = inject(NzTableComponent<any>)
  private config = inject(ConfigService)

  tablePaginator = input<string>()

  storageKey = computed(() => (this.tablePaginator() ? `${DEFAULT_KEY}_${this.tablePaginator()}` : DEFAULT_KEY))

  pageSize = computed(() => {
    const pageSizeOptions = this.config.pageSizeOptions()
    const pageSize = Number(localStorage.getItem(this.storageKey()) ?? this.config.defaultPageSize())

    if (pageSizeOptions.includes(pageSize)) {
      return pageSize
    }

    return pageSizeOptions[0]
  })

  constructor() {
    effect(() => {
      const pageSize = this.pageSize()
      this.table.nzPageSize = pageSize
      this.table.onPageSizeChange(pageSize)
    })
  }

  ngOnInit(): void {
    this.table.nzShowSizeChanger = true
    this.table.nzPageSizeOptions = this.config.pageSizeOptions()
    this.table.nzPageSizeChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((size) => {
      localStorage.setItem(this.storageKey(), String(size))
    })
  }
}
