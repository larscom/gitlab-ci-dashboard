import { ProjectPipeline } from '$models/project-pipeline'
import { formatDateTime } from '$util/date-format'
import { sortRecords } from '$util/sort-records'
import { PartitionOutlined } from '@ant-design/icons'
import { ActionIcon, Box, Group, Text, Tooltip } from '@mantine/core'
import { DataTable } from 'mantine-datatable'
import { useEffect, useState } from 'react'
import ProjectRowExpansion from './ProjectRowExpansion'

const PAGE_SIZE = 10

interface Props {
  projects: ProjectPipeline[]
}
export default function ProjectsWithPipelineTable({ projects }: Props) {
  const [page, setPage] = useState(1)
  const [sortedProjects, setSortedProjects] = useState(
    sortRecords(projects, ['project', 'name'], 'asc').slice(0, PAGE_SIZE)
  )

  useEffect(() => setPage(1), [projects, setPage])

  useEffect(() => {
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE
    setSortedProjects(
      sortRecords(projects, ['project', 'name'], 'asc').slice(from, to)
    )
  }, [projects, page, setSortedProjects])

  return (
    <Box>
      <DataTable
        idAccessor="project.id"
        records={sortedProjects}
        totalRecords={projects.length}
        recordsPerPage={PAGE_SIZE}
        page={page}
        onPageChange={setPage}
        columns={[
          {
            accessor: 'project.id',
            title: 'Id'
          },
          {
            accessor: 'project.name',
            title: 'Name'
          },
          {
            accessor: 'project.defaultBranch',
            title: 'Branch'
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
            render({ pipeline }) {
              return <Text>{pipeline?.source || '-'}</Text>
            }
          },
          {
            accessor: 'pipeline.updatedAt',
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
