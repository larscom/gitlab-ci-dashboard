import { BranchWithLatestPipeline } from '$models/branch-with-pipeline'
import { formatDateTime } from '$util/date-format'
import { sortRecords } from '$util/sort-records'
import { statusToColor } from '$util/status-to-color'
import { PartitionOutlined } from '@ant-design/icons'
import { ActionIcon, Box, Group, Text, Tooltip } from '@mantine/core'
import { DataTable, DataTableSortStatus } from 'mantine-datatable'
import { useEffect, useState } from 'react'

interface Props {
  branches: BranchWithLatestPipeline[]
}

export default function BranchWithPipelineTable({ branches }: Props) {
  const [sortedBranches, setSortedBranches] = useState(branches)
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'branch.name',
    direction: 'asc'
  })

  useEffect(() => {
    const propNames = sortStatus.columnAccessor.split('.')
    setSortedBranches(sortRecords(branches, propNames, sortStatus.direction))
  }, [branches, sortStatus])

  return (
    <Box
      className={
        sortedBranches.length === 0
          ? 'h-[150px]'
          : sortedBranches.length > 10
          ? 'h-[400px]'
          : 'h-auto'
      }
    >
      <DataTable
        className="border-solid border border-neutral-300"
        idAccessor="branch.name"
        noRecordsText="No branches"
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        records={sortedBranches}
        columns={[
          {
            accessor: 'branch.name',
            title: 'Branch',
            sortable: true
          },
          {
            accessor: 'pipeline.status',
            title: 'Status',
            sortable: true,
            render({ pipeline }) {
              return (
                <Text
                  color={pipeline?.status && statusToColor(pipeline.status)}
                  weight="bold"
                >
                  {pipeline?.status || '-'}
                </Text>
              )
            }
          },
          {
            accessor: 'pipeline.source',
            title: 'Source',
            sortable: true,
            render({ pipeline }) {
              return <Text>{pipeline?.source || '-'}</Text>
            }
          },
          {
            accessor: 'pipeline.updatedAt',
            title: 'Updated',
            sortable: true,
            render({ pipeline }) {
              const updatedAt = pipeline?.updatedAt
              const dateTime = updatedAt ? formatDateTime(updatedAt) : undefined
              return <Text>{dateTime || '-'}</Text>
            }
          },
          {
            accessor: '',
            render({ branch, pipeline }) {
              return (
                <Group>
                  <ActionIcon
                    onClick={(e) => {
                      e.stopPropagation()
                      pipeline
                        ? window.open(pipeline.webUrl, '_blank')
                        : window.open(`${branch.webUrl}/-/pipelines`, '_blank')
                    }}
                    variant="transparent"
                  >
                    <Tooltip
                      openDelay={250}
                      label={`Show pipeline (${branch.name})`}
                    >
                      <PartitionOutlined />
                    </Tooltip>
                  </ActionIcon>
                </Group>
              )
            }
          }
        ]}
      />
    </Box>
  )
}
