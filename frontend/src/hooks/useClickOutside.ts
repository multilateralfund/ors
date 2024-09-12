import { useEffect, useRef } from 'react'

function useClickOutside<T extends Element = Element>(callback: () => void) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Element)) {
        callback()
      }
    }

    document.addEventListener('mouseup', handleClickOutside)
    document.addEventListener('touchend', handleClickOutside)

    return () => {
      document.removeEventListener('mouseup', handleClickOutside)
      document.removeEventListener('touchend', handleClickOutside)
    }
  }, [ref, callback])

  return ref
}

export default useClickOutside
