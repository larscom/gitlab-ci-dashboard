export const filterBy = (value: string, query: string) =>
  value.toLocaleLowerCase().includes(query.toLocaleLowerCase())
