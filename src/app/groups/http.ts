import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http'
import { RetryConfig, throwError, timer } from 'rxjs'
import { GroupId } from './model/group'
import { ProjectId } from './model/project'

export const retryConfig: RetryConfig = {
  count: 5,
  delay: (error: HttpErrorResponse, retryCount: number) => {
    if (error.status === HttpStatusCode.TooManyRequests) {
      return throwError(() => error)
    }
    return timer(500 * 2 ** (retryCount - 1))
  },
  resetOnSuccess: true
}

export const FETCH_REFRESH_INTERVAL = 10000

export function createParams(groupId: GroupId, projectIds?: Set<ProjectId>): { [key: string]: string } {
  const params = Object({ group_id: groupId })
  if (projectIds && projectIds.size > 0) {
    return { ...params, project_ids: Array.from(projectIds).join(',') }
  }
  return params
}
