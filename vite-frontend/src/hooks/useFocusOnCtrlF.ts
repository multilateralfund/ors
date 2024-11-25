import { useEffect, useRef } from 'react'

function useFocusOnCtrlF() {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'f' && ref.current) {
        event.preventDefault()
        ref.current.focus()
        ref.current.select()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [ref])

  return ref
}

export default useFocusOnCtrlF
