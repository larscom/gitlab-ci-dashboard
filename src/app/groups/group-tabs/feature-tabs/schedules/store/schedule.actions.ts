import { GroupId } from '$model/group'
import { actionsFactory, props } from '@ngneat/effects'
import { storeName } from './schedule.store'

const actions = actionsFactory(storeName)

export const fetchSchedules = actions.create('- Fetch Schedules', props<{ groupId: GroupId; withLoader?: boolean }>())
