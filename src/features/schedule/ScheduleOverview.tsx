import AutoRefresh from '$components/AutoRefresh'
import IndeterminateLoader from '$components/ui/IndeterminateLoader'
import { GroupContext } from '$contexts/group-context'
import ProjectFilter from '$feature/project/ProjectFilter'
import { useSchedules } from '$hooks/use-schedules'
import { Schedule } from '$models/schedule'
import { filterBy } from '$util/filter-by'
import { identity } from '$util/identity'
import { Group, Stack } from '@mantine/core'
import { useCallback, useContext, useMemo, useState } from 'react'
import ScheduleTable from './ScheduleTable'

const filter = (
  data: Schedule[],
  filterText: string,
  filterTopics: string[]
): Schedule[] => {
  return data
    .filter(({ project: { name } }) => filterBy(name, filterText))
    .filter(({ project: { topics } }) => {
      return filterTopics.length
        ? filterTopics.map((filter) => topics.includes(filter)).every(identity)
        : true
    })
}

export default function ScheduleOverview() {
  const { groupId } = useContext(GroupContext)
  const { isLoading, refetch, isRefetching, data = [] } = useSchedules(groupId)

  const [filterText, setFilterText] = useState<string>('')
  const [filterTopics, setFilterTopics] = useState<string[]>([])

  const schedules = useMemo(
    () => filter(data, filterText, filterTopics),
    [data, filterText, filterTopics]
  )

  return (
    <Stack>
      <Group className="justify-between">
        <ProjectFilter
          projects={data.map(({ project }) => project)}
          disabled={isLoading}
          groupId={groupId}
          filterText={filterText}
          filterTopics={filterTopics}
          // eslint-disable-next-line
          setFilterText={useCallback(setFilterText, [])}
          // eslint-disable-next-line
          setFilterTopics={useCallback(setFilterTopics, [])}
        />
        <AutoRefresh
          id="schedule"
          loadingColor="teal"
          loading={isRefetching}
          refetch={refetch}
          disabled={isLoading}
        />
      </Group>
      {isLoading ? <IndeterminateLoader /> : <ScheduleTable schedules={schedules} />}
    </Stack>
  )
}
