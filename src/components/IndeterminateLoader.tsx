import { MantineColor, MantineNumberSize, Progress } from '@mantine/core'

interface Props {
  color?: MantineColor
  size?: MantineNumberSize
}
export default function IndeterminateLoader({
  color = 'teal',
  size = 'md',
}: Props) {
  return <Progress color={color} animate size={size} value={100} />
}
