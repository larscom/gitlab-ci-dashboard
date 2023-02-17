import IndeterminateLoader from '$components/IndeterminateLoader'
import BranchWithPipelineTable from '$feature/branch/BranchWithPipelineTable'
import { useBranches } from '$hooks/use-branches'
import { ProjectWithLatestPipeline } from '$models/project-with-pipeline'
import { CloseSquareOutlined, SearchOutlined } from '@ant-design/icons'
import { ActionIcon, Group, Input, Stack, Tooltip } from '@mantine/core'

interface Props {
  project: ProjectWithLatestPipeline
}

export default function ProjectRowExpansion({ project }: Props) {
  const { isLoading: loading, data: branches = [] } = useBranches(
    project.project.id
  )

  if (loading) {
    return <IndeterminateLoader />
  }

  const reset = (
    <ActionIcon variant="transparent">
      <Tooltip openDelay={250} label="Clear field">
        <CloseSquareOutlined />
      </Tooltip>
    </ActionIcon>
  )

  return (
    <Stack className="p-3">
      <Group>
        <Input
          icon={<SearchOutlined />}
          rightSection={reset}
          placeholder="Search branches..."
        />
      </Group>
      <BranchWithPipelineTable
        branches={branches.filter(({ branch }) => !branch.default)}
      />
    </Stack>
  )
}
