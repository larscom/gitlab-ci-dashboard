export interface Branch {
  name: string
  merged: boolean
  protected: boolean
  default: boolean
  canPush: boolean
  webUrl: string
  commit: Commit
}

export interface Commit {
  id: string
  authorName: string
  committerName: string
  committedDate: string
  title: string
  message: string
}
