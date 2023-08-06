export const filterBy = (value: string, filterText: string): boolean =>
  value.toLocaleLowerCase().includes(filterText.toLocaleLowerCase())
