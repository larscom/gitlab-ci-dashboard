import { GroupId } from '$groups/model/group'
import { ProjectId } from '$groups/model/project'
import { actionsFactory, props } from '@ngneat/effects'
import { storeName } from './latest-pipeline.store'

const actions = actionsFactory(storeName)

export const fetchProjectsWithLatestPipeline = actions.create(
  '- Fetch Projects',
  props<{ groupId: GroupId; withLoader?: boolean }>()
)

export const fetchBranchesWithLatestPipeline = actions.create(
  '- Fetch Branches',
  props<{ projectId: ProjectId; withLoader?: boolean }>()
)

export const resetAllFilters = actions.create('- Reset Filters')
