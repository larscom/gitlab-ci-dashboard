import { GroupId } from '$groups/model/group'
import { ProjectId } from '$groups/model/project'
import { ErrorContext, ErrorService } from '$service/error.service'
import { HttpStatusCode } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { Injectable, Signal, computed, effect, inject, signal } from '@angular/core'
import { AuthService } from '$service/auth.service'

const STORAGE_KEY = 'favorite_projects'

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private _favorites = signal<Map<GroupId, Set<ProjectId>>>(this.getFromStorage())
  private errorService = inject(ErrorService)
  private auth = inject(AuthService)
  private http = inject(HttpClient)
  private loadedUser = ''

  readonly favorites = this._favorites.asReadonly()

  constructor() {
    effect(() => {
      const error = this.errorService.error()
      if (error) {
        this.removeGroupWhen404(error)
      }
    })
    effect(() => {
      const username = this.auth.authenticated() ? this.auth.username() : ''
      if (!username) { this.loadedUser=''; this._favorites.set(new Map()); return }
      if (username === this.loadedUser) return
      this.loadedUser = username
      this.http.get<{favorite_projects:Record<string,ProjectId[]>}>('api/preferences').subscribe(({favorite_projects}) => {
        const map=new Map(Object.entries(favorite_projects||{}).map(([groupId,projectIds])=>[Number(groupId),new Set(projectIds)] as [GroupId,Set<ProjectId>]))
        this._favorites.set(map)
        this.saveToStorage(map)
      })
    })
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
      const projectIds = new Set(map.get(groupId)!)
      projectIds.add(projectId)
      map.set(groupId, projectIds)
    } else {
      map.set(groupId, new Set([projectId]))
    }

    this._favorites.set(map)

    this.saveToStorage(map)
    this.saveToServer(map)
  }

  removeProject(groupId: GroupId, projectId: ProjectId) {
    const map = new Map(this._favorites())
    if (!map.has(groupId)) return

    const projectIds = new Set(map.get(groupId)!)
    projectIds.delete(projectId)

    if (projectIds.size > 0) {
      map.set(groupId, new Set(projectIds))
      this._favorites.set(map)
      this.saveToStorage(map)
      this.saveToServer(map)
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
    this.saveToServer(map)
  }

  removeAll() {
    const map = new Map()
    this._favorites.set(map)
    this.saveToStorage(map)
    this.saveToServer(map)
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

  private saveToServer(favorites:Map<GroupId,Set<ProjectId>>){
    if(!this.auth.authenticated())return
    const favorite_projects=Object.fromEntries(Array.from(favorites.entries()).map(([groupId,projectIds])=>[groupId,Array.from(projectIds)]))
    this.http.put('api/preferences/favorites',{favorite_projects}).subscribe()
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
