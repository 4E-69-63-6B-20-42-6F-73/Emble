import { useEffect, useRef } from 'react'

export function useDebounced(fn: () => void, wait: number, deps: React.DependencyList) {
  const ref = useRef<() => void>()
  useEffect(() => { ref.current = fn })
  useEffect(() => {
    const h = setTimeout(() => ref.current && ref.current(), wait)
    return () => clearTimeout(h)
  }, deps)
}
