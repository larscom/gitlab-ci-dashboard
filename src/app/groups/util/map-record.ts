export function mapToRecord<K extends keyof any, V>(map: Map<K, V>): Record<K, V> {
  return Object.fromEntries(map) as Record<K, V>
}

export function recordToMap<K extends keyof any, V>(record: Record<K, V>): Map<K, V> {
  return new Map(Object.entries(record)) as Map<K, V>
}
