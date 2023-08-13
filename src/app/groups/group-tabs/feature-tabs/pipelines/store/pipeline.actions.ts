import { GroupId } from '$groups/model/group'
import { actionsFactory, props } from '@ngneat/effects'
import { storeName } from './pipeline.store'

const actions = actionsFactory(storeName)

export const fetchProjectsWithPipeline = actions.create(
  '- Fetch Projects',
  props<{ groupId: GroupId; withLoader?: boolean }>()
)

export const resetAllFilters = actions.create('- Reset Filters')
