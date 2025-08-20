import { useEffect } from 'react'

export function useResize<T extends HTMLElement>(el: React.RefObject<T>, onSize: () => void) {
  useEffect(() => {
    if (!el?.current) return
    const ro = new ResizeObserver(() => onSize())
    ro.observe(el.current)
    return () => ro.disconnect()
  }, [el, onSize])
}
