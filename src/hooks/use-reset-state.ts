import { useMemo, useState, useCallback } from 'react'

type INextState<T> = T | ((prevState: T) => T)
export function useResetState<T> (
  initValue: T
): [T, (nextState: INextState<T>) => void, () => void] {
  const [state, setState] = useState(initValue)
  const reset = useMemo(() => {
    return () => setState(initValue)
  }, [initValue, setState])
  const setter = useCallback(
    (next: INextState<T>) => {
      setState(next)
    },
    [setState]
  )
  const result = useMemo(() => {
    return [state, setter, reset] as [
      T,
      (nextState: INextState<T>) => void,
      () => void
    ]
  }, [[state, setter, reset]])
  return result
}
