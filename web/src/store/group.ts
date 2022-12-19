import create from 'zustand'
import { Group } from '../models/group'

interface GroupState {
  groups: Group[]
  setGroups: (groups: Group[]) => void
}

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  setGroups: (groups: Group[]) => set({ groups }),
}))
