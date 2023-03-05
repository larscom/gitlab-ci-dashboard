import { DataTableSortStatus } from 'mantine-datatable'
import { sortRecords } from './sort-records'

interface TestOjbect {
  subject: {
    stringValue: string
    numberValue: number
    dateValue: Date
  }
}

describe('sort-records', () => {
  const data: TestOjbect[] = [
    {
      subject: {
        stringValue: 'abc',
        numberValue: 1,
        dateValue: new Date('2023-02-04T11:53:47.267Z')
      }
    },
    {
      subject: {
        stringValue: 'xyz',
        numberValue: 10,
        dateValue: new Date('2023-03-04T11:53:47.267Z')
      }
    }
  ]

  it('should not sort if propName is not present on object', () => {
    const sorted = sortRecords(data, ['unknown', 'test'], 'desc')
    expect(sorted).toEqual(data)
  })

  describe('ascending', () => {
    const asc: DataTableSortStatus['direction'] = 'asc'

    it('should sort by string', () => {
      const sorted = sortRecords(data, ['subject', 'stringValue'], asc)

      expect(sorted).toHaveLength(2)
      expect(sorted[0].subject.stringValue).toEqual('abc')
    })

    it('should sort by number', () => {
      const sorted = sortRecords(data, ['subject', 'numberValue'], asc)

      expect(sorted).toHaveLength(2)
      expect(sorted[0].subject.numberValue).toEqual(1)
    })

    it('should sort by date', () => {
      const sorted = sortRecords(data, ['subject', 'dateValue'], asc)

      expect(sorted).toHaveLength(2)
      expect(sorted[0].subject.dateValue.toISOString()).toEqual(
        '2023-02-04T11:53:47.267Z'
      )
    })
  })

  describe('descending', () => {
    const desc: DataTableSortStatus['direction'] = 'desc'

    it('should sort by string', () => {
      const sorted = sortRecords(data, ['subject', 'stringValue'], desc)

      expect(sorted).toHaveLength(2)
      expect(sorted[0].subject.stringValue).toEqual('xyz')
    })

    it('should sort by number', () => {
      const sorted = sortRecords(data, ['subject', 'numberValue'], desc)

      expect(sorted).toHaveLength(2)
      expect(sorted[0].subject.numberValue).toEqual(10)
    })

    it('should sort by date', () => {
      const sorted = sortRecords(data, ['subject', 'dateValue'], desc)

      expect(sorted).toHaveLength(2)
      expect(sorted[0].subject.dateValue.toISOString()).toEqual(
        '2023-03-04T11:53:47.267Z'
      )
    })
  })
})
