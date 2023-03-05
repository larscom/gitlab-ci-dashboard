import { DataTableSortStatus } from 'mantine-datatable'
import { sortRecords } from './sort-records'

interface TestOjbect {
  id: number
  subject: {
    stringValue: string
    numberValue: number
    dateValue: Date
    dateStringValue: string
  }
}

describe('sort-records', () => {
  const data: TestOjbect[] = [
    {
      id: 2,
      subject: {
        stringValue: 'b',
        numberValue: 2,
        dateValue: new Date('2023-02-05T11:53:47.267Z'),
        dateStringValue: '2023-02-05T11:53:47.267Z'
      }
    },
    {
      id: 1,
      subject: {
        stringValue: 'a',
        numberValue: 1,
        dateValue: new Date('2023-02-04T11:53:47.267Z'),
        dateStringValue: '2023-02-04T11:53:47.267Z'
      }
    },
    {
      id: 3,
      subject: {
        stringValue: 'c',
        numberValue: 3,
        dateValue: new Date('2023-02-06T11:53:47.267Z'),
        dateStringValue: '2023-02-06T11:53:47.267Z'
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

      expect(sorted).toHaveLength(3)
      expect(sorted[0].id).toEqual(1)
    })

    it('should sort by number', () => {
      const sorted = sortRecords(data, ['subject', 'numberValue'], asc)

      expect(sorted).toHaveLength(3)
      expect(sorted[0].id).toEqual(1)
    })

    it('should sort by date object', () => {
      const sorted = sortRecords(data, ['subject', 'dateValue'], asc)

      expect(sorted).toHaveLength(3)
      expect(sorted[0].id).toEqual(1)
    })

    it('should sort by date string', () => {
      const sorted = sortRecords(data, ['subject', 'dateStringValue'], asc)

      expect(sorted).toHaveLength(3)
      expect(sorted[0].id).toEqual(1)
    })
  })

  describe('descending', () => {
    const desc: DataTableSortStatus['direction'] = 'desc'

    it('should sort by string', () => {
      const sorted = sortRecords(data, ['subject', 'stringValue'], desc)

      expect(sorted).toHaveLength(3)
      expect(sorted[0].id).toEqual(3)
    })

    it('should sort by number', () => {
      const sorted = sortRecords(data, ['subject', 'numberValue'], desc)

      expect(sorted).toHaveLength(3)
      expect(sorted[0].id).toEqual(3)
    })

    it('should sort by date object', () => {
      const sorted = sortRecords(data, ['subject', 'dateValue'], desc)

      expect(sorted).toHaveLength(3)
      expect(sorted[0].id).toEqual(3)
    })

    it('should sort by date string', () => {
      const sorted = sortRecords(data, ['subject', 'dateStringValue'], desc)

      expect(sorted).toHaveLength(3)
      expect(sorted[0].id).toEqual(3)
    })
  })
})
