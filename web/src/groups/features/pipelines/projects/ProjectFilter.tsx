import { SearchOutlined } from '@ant-design/icons'
import { Input } from '@mantine/core'

export default function ProjectFilter() {
  return (
    <Input
      icon={<SearchOutlined />}
      onChange={(e: any) => console.info(e)}
      placeholder="Search projects..."
    />
  )
}
