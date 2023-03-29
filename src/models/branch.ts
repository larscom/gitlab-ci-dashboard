export interface Branch {
  name: string
  merged: boolean
  protected: boolean
  default: boolean
  can_push: boolean
  web_url: string
  commit: Commit
}

export interface Commit {
  id: string
  author_name: string
  committer_name: string
  committed_date: string
  title: string
  message: string
}
