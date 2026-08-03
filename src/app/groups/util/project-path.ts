import { Project } from '$groups/model/project'

export function projectNamespacePath({ namespace }: Project): string {
  return namespace.full_path || namespace.path
}

export function projectFullPath(project: Project): string {
  return `${projectNamespacePath(project)}/${project.path || project.name}`
}
