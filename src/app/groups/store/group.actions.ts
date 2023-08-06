import { actionsFactory } from '@ngneat/effects'
import { storeName } from './group.store'

const actions = actionsFactory(storeName)

export const fetchGroups = actions.create('- Fetch Groups')
