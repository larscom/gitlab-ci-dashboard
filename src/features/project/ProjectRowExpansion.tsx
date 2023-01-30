import { ProjectWithLatestPipeline } from '$models/project-with-pipeline'
import { Group, Stack, Text } from '@mantine/core'
import { Autocomplete } from '@mantine/core'
import { Select } from '@mantine/core'

interface Props {
  project: ProjectWithLatestPipeline
}

export default function ProjectRowExpansion({ project }: Props) {
  return (
    <Stack p="xs" spacing={6} align='center'>
      <Select zIndex={10000}
        searchable
        label="Branch"
        placeholder="Pick one"
        data={[
          { value: 'react', label: 'React' },
          { value: 'ng', label: 'Angular' },
          { value: 'svelte', label: 'Svelte' },
          { value: 'vue', label: 'Vue' }
        ]}
      />
    </Stack>
  )
}
