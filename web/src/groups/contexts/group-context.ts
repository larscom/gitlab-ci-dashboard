import { GroupId } from '$groups/models/group'
import { createContext } from 'react'

interface GroupContext {
  groupId: GroupId
}

export const GroupContext = createContext<GroupContext>({ groupId: 0 })

export const GroupContextProvider = GroupContext.Provider
