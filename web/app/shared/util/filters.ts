export const filterBy = (value: string, filterText: string) =>
  value.toLocaleLowerCase().includes(filterText.toLocaleLowerCase())
