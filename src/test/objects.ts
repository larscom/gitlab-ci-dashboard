import { BranchPipeline } from '$models/branch-pipeline'
import { Group, GroupId } from '$models/group'
import { ProjectPipeline } from '$models/project-pipeline'

export function createGroup(id: GroupId, name: string): Group {
  return { id, name }
}

export function createBranchWithPipeline(branchName: string): BranchPipeline {
  return {
    branch: {
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
}

export function createProjectWithPipeline(projectName: string): ProjectPipeline {
  return {
    project: {
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
}
