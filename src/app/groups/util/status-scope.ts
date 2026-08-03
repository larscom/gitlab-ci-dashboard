import { Status } from '$groups/model/status'

export function statusToScope(_status?: Status): Status[] {
  // Do not filter jobs by the parent pipeline status. A successful parent can
  // still own a running downstream pipeline, and filtering would hide both its
  // bridge and its active child jobs.
  return []
}
