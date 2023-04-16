import { GroupId } from '$models/group'
import { createContext } from 'react'

interface GroupContext {
  groupId?: GroupId
}

export const GroupContext = createContext<GroupContext>({})

export const GroupContextProvider = GroupContext.Provider
