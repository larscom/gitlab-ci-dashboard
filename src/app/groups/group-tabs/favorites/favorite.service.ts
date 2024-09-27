import { GroupId } from '$groups/model/group'
import { ProjectId } from '$groups/model/project'
import { ErrorContext, ErrorService } from '$service/error.service'
import { HttpStatusCode } from '@angular/common/http'
import { Injectable, Signal, computed, effect, inject, signal } from '@angular/core'

const STORAGE_KEY = 'favorite_projects'

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private _favorites = signal<Map<GroupId, Set<ProjectId>>>(this.getFromStorage())
  private errorService = inject(ErrorService)

  readonly favorites = this._favorites.asReadonly()

  constructor() {
    effect(
      () => {
        const error = this.errorService.error()
        if (error) {
          this.removeGroupWhen404(error)
        }
      },
      { allowSignalWrites: true }
    )
  }

  anyProject(groupId: GroupId, projectId: ProjectId): Signal<boolean> {
    return computed(() => {
      const map = this._favorites()
      if (map.has(groupId)) {
        const projectIds = map.get(groupId)!
        return projectIds.has(projectId)
      }
      return false
    })
  }

  addProject(groupId: GroupId, projectId: ProjectId) {
    const map = new Map(this._favorites())

    if (map.has(groupId)) {
      const projectIds = map.get(groupId)!
      map.set(groupId, projectIds.add(projectId))
    } else {
      map.set(groupId, new Set([projectId]))
    }

    this._favorites.set(map)

    this.saveToStorage(map)
  }

  removeProject(groupId: GroupId, projectId: ProjectId) {
    const map = new Map(this._favorites())
    if (!map.has(groupId)) return

    const projectIds = map.get(groupId)!
    projectIds.delete(projectId)

    if (projectIds.size > 0) {
      map.set(groupId, new Set(projectIds))
      this._favorites.set(map)
      this.saveToStorage(map)
    } else {
      this.removeGroup(groupId)
    }
  }

  removeGroup(groupId: GroupId) {
    const map = new Map(this._favorites())
    if (!map.has(groupId)) return

    map.delete(groupId)

    this._favorites.set(map)

    this.saveToStorage(map)
  }

  removeAll() {
    const map = new Map()
    this._favorites.set(map)
    this.saveToStorage(map)
  }

  private removeGroupWhen404({ statusCode, groupId }: ErrorContext) {
    if (statusCode === HttpStatusCode.NotFound && groupId) {
      this.removeGroup(groupId)
    }
  }

  private saveToStorage(favorites: Map<GroupId, Set<ProjectId>>) {
    const record = Object.fromEntries(
      Array.from(favorites.entries()).map(([groupId, projectIds]) => [groupId, Array.from(projectIds)])
    )

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
    } catch (_) {}
  }

  private getFromStorage(): Map<GroupId, Set<ProjectId>> {
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
