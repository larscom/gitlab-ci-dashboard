import { MantineColor, MantineNumberSize, Progress } from '@mantine/core'

interface IndeterminateLoaderProps {
  color?: MantineColor
  size?: MantineNumberSize
}
export default function IndeterminateLoader({
  color = 'teal',
  size = 'md',
}: IndeterminateLoaderProps) {
  return <Progress color={color} animate size={size} value={100} />
}
