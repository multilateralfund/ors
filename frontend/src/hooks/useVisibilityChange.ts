import { useEffect } from 'react'

function useVisibilityChange(enable: boolean) {
  useEffect(() => {
    function handleBeforeUnload(evt: BeforeUnloadEvent) {
      if (enable) {
        evt.preventDefault()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [enable])
}

export default useVisibilityChange
