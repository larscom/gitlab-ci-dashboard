import { RetryConfig } from 'rxjs'
import { ProjectId } from './model/project'
import { GroupId } from './model/group'

export const retryConfig: RetryConfig = {
  count: 5,
  delay: 500
}

export const FETCH_REFRESH_INTERVAL = 2000

export function createParams(groupId: GroupId, projectIds?: Set<ProjectId>): { [key: string]: string } {
  const params = Object({ group_id: groupId })
  if (projectIds && projectIds.size > 0) {
    return { ...params, project_ids: Array.from(projectIds).join(',') }
  }
  return params
}
