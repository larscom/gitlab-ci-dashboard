import { Branch } from '$models/branch'
import { Group, GroupId } from '$models/group'
import { Status } from '$models/pipeline'
import { Project } from '$models/project'
import { Schedule } from '$models/schedule'

export function createGroup(id: GroupId, name: string): Group {
  return { id, name }
}

export function createBranch(branchName: string): Branch {
  return {
    name: branchName,
    merged: false,
    protected: true,
    default: true,
    can_push: false,
    web_url: `https://example.com/${branchName}`,
    commit: {
      id: 'abc123',
      author_name: 'Alice',
      committer_name: 'Bob',
      committed_date: '2022-01-01T00:00:00Z',
      title: 'Initial commit',
      message: 'This is the initial commit'
    }
  }
}

export function createProject(projectName: string): Project {
  return {
    id: 1,
    name: projectName,
    web_url: `https://example.com/${projectName}`,
    default_branch: 'master',
    topics: [],
    namespace: {
      id: 1,
      name: 'namespace'
    }
  }
}

export function createSchedule(projectName: string): Schedule {
  return {
    id: 369851,
    description: 'Schedule 1',
    ref: 'master',
    cron: '0 12 * * *',
    cron_timezone: 'Europe/Amsterdam',
    next_run_at: '2023-04-24T10:00:00Z',
    active: true,
    created_at: '2023-04-03T19:51:22.767Z',
    updated_at: '2023-04-23T10:00:45.63Z',
    owner: {
      id: 13081321,
      username: 'gitlab.ci.dashboard',
      name: 'Gitlab CI Dashboard',
      state: 'active',
      is_admin: false
    },
    project: createProject(projectName),
    pipeline_status: Status.SUCCESS
  }
}
