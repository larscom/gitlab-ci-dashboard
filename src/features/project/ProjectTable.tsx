import { Project } from '$models/project'
import { formatDateTime } from '$util/date-format'
import { sortRecords } from '$util/sort-records'
import { NodeExpandOutlined } from '@ant-design/icons'
import { ActionIcon, Box, Group, Text, Tooltip } from '@mantine/core'
import { DataTable } from 'mantine-datatable'
import { useEffect, useState } from 'react'
import ProjectRowExpansion from './ProjectRowExpansion'

const PAGE_SIZE = 10

interface Props {
  projects: Project[]
}
export default function ProjectTable({ projects }: Props) {
  const [page, setPage] = useState(1)
  const [sortedProjects, setSortedProjects] = useState(
    sortRecords(projects, ['name'], 'asc').slice(0, PAGE_SIZE)
  )

  useEffect(() => setPage(1), [projects])

  useEffect(() => {
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE
    setSortedProjects(sortRecords(projects, ['name'], 'asc').slice(from, to))
  }, [page, projects])

  return (
    <Box>
      <DataTable
        records={sortedProjects}
        totalRecords={projects.length}
        recordsPerPage={PAGE_SIZE}
        page={page}
        onPageChange={setPage}
        columns={[
          {
            accessor: 'id',
            title: 'Id'
          },
          {
            accessor: 'name',
            title: 'Name'
          },
          {
            accessor: 'default_branch',
            title: 'Branch'
          },
          {
            accessor: 'topics',
            title: 'Topics',
            render({ topics }) {
              return (
                <Text className="lowercase">
                  {topics.length ? topics.join(',') : '-'}
                </Text>
              )
            }
          },
          {
            accessor: 'latest_pipeline.source',
            title: 'Trigger',
            render({ latest_pipeline }) {
              return <Text>{latest_pipeline?.source || '-'}</Text>
            }
          },
          {
            accessor: 'latest_pipeline.updated_at',
            title: 'Last Run',
            render({ latest_pipeline }) {
              const updatedAt = latest_pipeline?.updated_at
              const dateTime = updatedAt ? formatDateTime(updatedAt) : undefined
              return <Text>{dateTime || '-'}</Text>
            }
          },
          {
            accessor: '',
            render({ web_url, default_branch, latest_pipeline }) {
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
                    <Tooltip openDelay={250} label={`Show pipeline (${default_branch})`}>
                      <NodeExpandOutlined />
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
