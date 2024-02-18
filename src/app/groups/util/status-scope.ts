import { Status } from '$groups/model/status'

export function statusToScope(status?: Status): Status[] {
  if (!status) {
    return []
  }

  switch (status) {
    case Status.SUCCESS: {
      return [Status.FAILED]
    }
    case Status.FAILED: {
      return [Status.FAILED, Status.CANCELED]
    }
    case Status.RUNNING: {
      return [Status.RUNNING, Status.PENDING]
    }
    default: {
      return [status]
    }
  }
}
