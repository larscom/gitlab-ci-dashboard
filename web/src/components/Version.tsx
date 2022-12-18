import { Text } from '@mantine/core'
import { useEffect, useState } from 'react'

export default function Version() {
  const [version, setVersion] = useState('')
  useEffect(() => {
    fetch('/api/version')
      .then((r) => r.text())
      .then((value) => setVersion(value))
  }, [])
  return (
    <Text className="text-white hidden sm:block" size="xs">
      {version}
    </Text>
  )
}
