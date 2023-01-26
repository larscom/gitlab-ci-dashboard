import { ProjectWithLatestPipeline } from '$models/project-with-pipeline'
import { Box, Text } from '@mantine/core'
import { DataTable, DataTableSortStatus } from 'mantine-datatable'
import { useEffect, useState } from 'react'

const format: Intl.DateTimeFormatOptions = {
  month: '2-digit',
  day: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
}

const languages = [...(navigator?.languages || ['en-US'])]

const dateMatcher = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/
const sortBy = (
  projects: ProjectWithLatestPipeline[],
  propNames: string[],
  direction: DataTableSortStatus['direction']
) => {
  return Array.from(projects).sort((a, b) => {
    const propA = a[propNames[0]] ? a[propNames[0]][propNames[1]] : null
    const propB = b[propNames[0]] ? b[propNames[0]][propNames[1]] : null

    if (propA == null && propB == null) {
      return 0
    }

    const isDate =
      dateMatcher.test(String(propA)) && dateMatcher.test(String(propB))

    const isNumber = typeof propA === 'number' && typeof propB === 'number'
    const isAscending = direction === 'asc'

    if (isDate) {
      return isAscending
        ? Number(new Date(propA)) - Number(new Date(propB))
        : Number(new Date(propB)) - Number(new Date(propA))
    }

    if (isNumber) {
      return isAscending ? propA - propB : propB - propA
    }

    return isAscending
      ? String(propA).localeCompare(propB)
      : String(propB).localeCompare(propA)
  })
}

interface Props {
  projects: ProjectWithLatestPipeline[]
}

export default function ProjectsWithPipelineTable({ projects }: Props) {
  const [sortedProjects, setSortedProjects] = useState(projects)
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'project.name',
    direction: 'asc'
  })

  useEffect(() => {
    const propNames = sortStatus.columnAccessor.split('.')
    setSortedProjects(sortBy(projects, propNames, sortStatus.direction))
  }, [projects, sortStatus])

  return (
    <Box className={sortedProjects.length > 10 ? 'h-[500px]' : 'h-auto'}>
      <DataTable
        striped
        highlightOnHover
        idAccessor="project.id"
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        records={sortedProjects}
        columns={[
          {
            accessor: 'project.id',
            title: 'Id',
            sortable: true
          },
          {
            accessor: 'project.name',
            title: 'Name',
            sortable: true
          },
          {
            accessor: 'project.defaultBranch',
            title: 'Branch',
            sortable: true
          },
          {
            accessor: 'project.topics',
            title: 'Topics',
            render({ project }) {
              return (
                <Text className="lowercase">
                  {project.topics.length ? project.topics.join(',') : '-'}
                </Text>
              )
            }
          },
          {
            accessor: 'pipeline.source',
            title: 'Triggered by',
            sortable: true,
            render({ pipeline }) {
              return <Text>{pipeline?.source || '-'}</Text>
            }
          },
          {
            accessor: 'pipeline.updatedAt',
            sortable: true,
            title: 'When',
            render({ pipeline }) {
              const dateTime = pipeline?.updatedAt
                ? new Intl.DateTimeFormat(languages, format).format(
                    new Date(pipeline?.updatedAt)
                  )
                : undefined
              return <Text>{dateTime || '-'}</Text>
            }
          }
        ]}
        onRowClick={({ project, pipeline }) =>
          pipeline
            ? window.open(pipeline.webUrl, '_blank')
            : window.open(`${project.webUrl}/-/pipelines`, '_blank')
        }
      />
    </Box>
  )
}
