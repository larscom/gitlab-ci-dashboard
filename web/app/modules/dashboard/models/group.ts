export type GroupId = number
export interface Group {
  id: GroupId
  parent_id: number
  description?: string
  web_url: string
  name: string
  avatar_url: string
}
