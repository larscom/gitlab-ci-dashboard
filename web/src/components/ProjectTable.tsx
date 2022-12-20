import { Box, Text } from '@mantine/core'
import { DataTable } from 'mantine-datatable'
import { ProjectWithLatestPipeline } from '../models/project-with-pipeline'

const format: Intl.DateTimeFormatOptions = {
  month: '2-digit',
  day: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}

const languages = [...(navigator?.languages || ['en-US'])]

interface ProjectTableProps {
  projects: ProjectWithLatestPipeline[]
}

export default function ProjectTable({ projects }: ProjectTableProps) {
  return (
    <Box className={projects.length > 10 ? 'h-[500px]' : 'h-auto'}>
      <DataTable
        withBorder
        striped
        highlightOnHover
        idAccessor="project.id"
        records={projects}
        columns={[
          {
            accessor: 'project.id',
            title: 'Id',
          },
          {
            accessor: 'project.name',
            title: 'Name',
          },
          {
            accessor: 'project.default_branch',
            title: 'Branch',
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
            },
          },
          {
            accessor: 'pipeline.source',
            title: 'Triggered by',
            render({ pipeline }) {
              return <Text>{pipeline?.source || '-'}</Text>
            },
          },
          {
            accessor: 'pipeline.updated_at',
            title: 'When',
            render({ pipeline }) {
              const dateTime = pipeline?.updated_at
                ? new Intl.DateTimeFormat(languages, format).format(
                    new Date(pipeline?.updated_at)
                  )
                : undefined
              return <Text>{dateTime || '-'}</Text>
            },
          },
        ]}
        onRowClick={({ project, pipeline }) =>
          pipeline
            ? window.open(pipeline.web_url, '_blank')
            : window.open(`${project.web_url}/-/pipelines`, '_blank')
        }
      />
    </Box>
  )
}
