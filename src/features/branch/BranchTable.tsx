import { Branch } from '$models/branch'
import { formatDateTime } from '$util/date-format'
import { sortRecords } from '$util/sort-records'
import { statusToColor } from '$util/status-to-color'
import { NodeExpandOutlined } from '@ant-design/icons'
import { ActionIcon, Box, Group, Text, Tooltip } from '@mantine/core'
import { DataTable, DataTableSortStatus } from 'mantine-datatable'
import { useEffect, useState } from 'react'

interface Props {
  branches: Branch[]
}

export default function BranchTable({ branches }: Props) {
  const [sortedBranches, setSortedBranches] = useState(branches)
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'name',
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
        idAccessor="name"
        noRecordsText="No branches"
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        records={sortedBranches}
        columns={[
          {
            accessor: 'name',
            title: 'Branch',
            sortable: true
          },
          {
            accessor: 'latest_pipeline.status',
            title: 'Status',
            sortable: true,
            render({ latest_pipeline }) {
              return (
                <Text
                  color={latest_pipeline?.status && statusToColor(latest_pipeline.status)}
                  weight="500"
                >
                  {latest_pipeline?.status || '-'}
                </Text>
              )
            }
          },
          {
            accessor: 'latest_pipeline.source',
            title: 'Trigger',
            sortable: true,
            render({ latest_pipeline }) {
              return <Text>{latest_pipeline?.source || '-'}</Text>
            }
          },
          {
            accessor: 'latest_pipeline.updated_at',
            title: 'Last Run',
            sortable: true,
            render({ latest_pipeline }) {
              const updatedAt = latest_pipeline?.updated_at
              const dateTime = updatedAt ? formatDateTime(updatedAt) : undefined
              return <Text>{dateTime || '-'}</Text>
            }
          },
          {
            accessor: '',
            render({ web_url, name, latest_pipeline }) {
              return (
                <Group>
                  <ActionIcon
                    onClick={(e) => {
                      e.stopPropagation()
                      latest_pipeline
                        ? window.open(latest_pipeline.web_url, '_blank')
                        : window.open(`${web_url}/-/pipelines`, '_blank')
                    }}
                    variant="transparent"
                  >
                    <Tooltip openDelay={250} label={`Show pipeline (${name})`}>
                      <NodeExpandOutlined />
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
