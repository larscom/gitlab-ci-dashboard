import { Schedule } from '$models/schedule'
import { formatDateTime } from '$util/date-format'
import { sortRecords } from '$util/sort-records'
import { statusToColor } from '$util/status-to-color'
import { ScheduleOutlined } from '@ant-design/icons'
import { ActionIcon, Box, Group, Text, Tooltip } from '@mantine/core'
import { DataTable, DataTableSortStatus } from 'mantine-datatable'
import { useEffect, useState } from 'react'

interface Props {
  schedules: Schedule[]
}
export default function ScheduleTable({ schedules }: Props) {
  const [sortedSchedules, setsortedSchedules] = useState(schedules)
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'pipeline_status',
    direction: 'asc'
  })

  useEffect(() => {
    const propNames = sortStatus.columnAccessor.split('.')
    setsortedSchedules(sortRecords(schedules, propNames, sortStatus.direction))
  }, [schedules, sortStatus])

  return (
    <Box
      className={
        sortedSchedules.length === 0
          ? 'h-[175px]'
          : sortedSchedules.length > 10
          ? 'h-[600px]'
          : 'h-auto'
      }
    >
      <DataTable
        idAccessor="id"
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        records={sortedSchedules}
        noRecordsText="No schedules"
        columns={[
          {
            accessor: 'project.name',
            title: 'Project',
            sortable: true
          },
          {
            accessor: 'description',
            title: 'Description'
          },
          {
            accessor: 'ref',
            title: 'Target',
            sortable: true,
            render({ ref, project }) {
              const isDefaultBranch = ref === project.default_branch
              const tooltip = `default branch: ${isDefaultBranch ? 'yes' : 'no'}`
              return (
                <Tooltip openDelay={250} label={tooltip}>
                  <Text>{ref}</Text>
                </Tooltip>
              )
            }
          },
          {
            accessor: 'project.topics',
            title: 'Topics',
            render({ project: { topics } }) {
              return (
                <Text className="lowercase">
                  {topics.length ? topics.join(',') : '-'}
                </Text>
              )
            }
          },
          {
            accessor: 'next_run_at',
            title: 'Next Run',
            sortable: true,
            render({ next_run_at }) {
              const now = Date.now()
              const next = new Date(next_run_at).getTime()
              const displayTime = formatDateTime(next_run_at)

              const diffHours = Math.round((next - now) / 3600000)
              const diffMinutes = () => (Math.round(next - now) / (1000 * 60)) | 0

              return (
                <Tooltip openDelay={250} label={displayTime}>
                  <Text>
                    in {diffHours > 0 ? diffHours : diffMinutes()}
                    {diffHours > 0 ? ' hours' : ' minutes'}
                  </Text>
                </Tooltip>
              )
            }
          },
          {
            accessor: 'owner.username',
            title: 'Owner',
            sortable: true,
            render({ owner }) {
              return (
                <Tooltip openDelay={250} label={owner.name}>
                  <Text>{owner.username}</Text>
                </Tooltip>
              )
            }
          },
          {
            accessor: 'pipeline_status',
            title: 'Status',
            sortable: true,
            render({ pipeline_status }) {
              return (
                <Text color={statusToColor(pipeline_status)} weight="500">
                  {pipeline_status}
                </Text>
              )
            }
          },
          {
            accessor: '',
            render({ project }) {
              return (
                <Group>
                  <ActionIcon
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(`${project.web_url}/-/pipeline_schedules`, '_blank')
                    }}
                    variant="transparent"
                  >
                    <Tooltip openDelay={250} label={`Show schedules (${project.name})`}>
                      <ScheduleOutlined />
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
