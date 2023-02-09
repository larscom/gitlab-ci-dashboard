import { ProjectWithLatestPipeline } from '$models/project-with-pipeline'
import { formatDateTime } from '$util/date-format'
import { sortRecords } from '$util/sort-records'
import { PartitionOutlined } from '@ant-design/icons'
import { ActionIcon, Box, Group, Text, Tooltip } from '@mantine/core'
import { DataTable, DataTableSortStatus } from 'mantine-datatable'
import { useEffect, useState } from 'react'
import ProjectRowExpansion from './ProjectRowExpansion'

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
    setSortedProjects(sortRecords(projects, propNames, sortStatus.direction))
  }, [projects, sortStatus])

  return (
    <Box className={sortedProjects.length > 10 ? 'h-[800px]' : 'h-auto'}>
      <DataTable
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
            title: 'Source',
            sortable: true,
            render({ pipeline }) {
              return <Text>{pipeline?.source || '-'}</Text>
            }
          },
          {
            accessor: 'pipeline.updatedAt',
            sortable: true,
            title: 'Updated',
            render({ pipeline }) {
              const updatedAt = pipeline?.updatedAt
              const dateTime = updatedAt ? formatDateTime(updatedAt) : undefined
              return <Text>{dateTime || '-'}</Text>
            }
          },
          {
            accessor: '',
            render({ project, pipeline }) {
              return (
                <Group>
                  <ActionIcon
                    onClick={(e) => {
                      e.stopPropagation()
                      pipeline
                        ? window.open(pipeline.webUrl, '_blank')
                        : window.open(`${project.webUrl}/-/pipelines`, '_blank')
                    }}
                    variant="transparent"
                  >
                    <Tooltip
                      openDelay={250}
                      label={`Show pipeline (${project.defaultBranch})`}
                    >
                      <PartitionOutlined />
                    </Tooltip>
                  </ActionIcon>
                </Group>
              )
            }
          }
        ]}
        rowExpansion={{
          content: ({ record }) => <ProjectRowExpansion project={record} />
        }}
      />
    </Box>
  )
}
