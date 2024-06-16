import { GroupId } from '$groups/model/group'
import { ProjectId } from '$groups/model/project'
import { Injectable, Signal, computed, signal } from '@angular/core'

const STORAGE_KEY = 'favorite_projects'

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private _favorites = signal<Map<GroupId, Set<ProjectId>>>(this.getFavorites())

  favorites = this._favorites.asReadonly()

  any(groupId: GroupId, projectId: ProjectId): Signal<boolean> {
    return computed(() => {
      const favorites = this._favorites()
      if (favorites.has(groupId)) {
        const projectIds = favorites.get(groupId)!
        return projectIds.has(projectId)
      }
      return false
    })
  }

  add(groupId: GroupId, projectId: ProjectId) {
    const favorites = this._favorites()

    if (favorites.has(groupId)) {
      const projectIds = favorites.get(groupId)!
      favorites.set(groupId, projectIds.add(projectId))
    } else {
      favorites.set(groupId, new Set([projectId]))
    }

    this.saveFavorites(this._favorites())
  }

  remove(groupId: GroupId, projectId: ProjectId) {
    const favorites = this._favorites()
    if (!favorites.has(groupId)) return

    const projectIds = favorites.get(groupId)!
    projectIds.delete(projectId)
    favorites.set(groupId, new Set(projectIds))

    this.saveFavorites(this._favorites())
  }

  removeAll() {
    this._favorites.set(new Map())

    this.saveFavorites(this._favorites())
  }

  private saveFavorites(favorites: Map<GroupId, Set<ProjectId>>) {
    const record = Object.fromEntries(
      Array.from(favorites.entries()).map(([groupId, projectIds]) => [groupId, Array.from(projectIds)])
    )

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
    } catch (_) {}
  }

  private getFavorites(): Map<GroupId, Set<ProjectId>> {
    try {
      const item = localStorage.getItem(STORAGE_KEY)
      if (item) {
        const record: Record<GroupId, ProjectId[]> = JSON.parse(item)
        return new Map(Object.entries(record).map(([groupId, projectIds]) => [Number(groupId), new Set(projectIds)]))
      }
    } catch (_) {}

    return new Map()
  }
}
