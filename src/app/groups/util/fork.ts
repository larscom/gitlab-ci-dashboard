import { GroupId } from '$groups/model/group'
import { ProjectId } from '$groups/model/project'
import { Observable, forkJoin, map } from 'rxjs'

export function forkJoinFlatten<T>(
  groupMap: Map<GroupId, Set<ProjectId>>,
  mapFn: (groupId: GroupId, projectIds: Set<ProjectId>) => Observable<Array<T>>
) {
  return forkJoin(Array.from(groupMap.entries()).map(([groupId, projectIds]) => mapFn(groupId, projectIds))).pipe(
    map((all) => all.flat())
  )
}
