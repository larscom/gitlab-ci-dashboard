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
      canPush: false,
      webUrl: `https://example.com/${branchName}`,
      commit: {
        id: 'abc123',
        authorName: 'Alice',
        committerName: 'Bob',
        committedDate: '2022-01-01T00:00:00Z',
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
      webUrl: `https://example.com/${projectName}`,
      defaultBranch: 'master',
      topics: [],
      namespace: {
        id: 1,
        name: 'namespace'
      }
    }
  }
}
