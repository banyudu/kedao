import { useDeepCompareEffect } from '@react-hookz/web'
import { useState } from 'react'

export function useDeepCompareMemo<T> (
  factory: () => T,
  deps: React.DependencyList
) {
  const [state, setState] = useState(factory)
  useDeepCompareEffect(() => {
    setState(() => factory())
  }, deps)
  return state
}
