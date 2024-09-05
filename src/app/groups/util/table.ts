export interface Header<T> {
  title: string
  sortable: boolean
  compare: ((a: T, b: T) => number) | null
}
