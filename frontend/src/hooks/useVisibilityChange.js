import { useEffect } from 'react'

function useVisibilityChange(enable) {
  useEffect(() => {
    function handleBeforeUnload(evt) {
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
