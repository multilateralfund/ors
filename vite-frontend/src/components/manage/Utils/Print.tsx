import { useEffect } from 'react'

export default function Print() {
  function onBeforePrint() {
    const printing = document.documentElement.getAttribute('data-printing')
    if (printing === 'no') {
      document.documentElement.setAttribute('data-printing', 'yes')
    }
  }

  function onAfterPrint() {
    const printing = document.documentElement.getAttribute('data-printing')
    if (printing === 'yes') {
      document.documentElement.setAttribute('data-printing', 'no')
    }
  }

  useEffect(() => {
    window.addEventListener('beforeprint', onBeforePrint)
    window.addEventListener('afterprint', onAfterPrint)

    return () => {
      window.removeEventListener('beforeprint', onBeforePrint)
      window.removeEventListener('afterprint', onAfterPrint)
    }
  }, [])

  return <div id="print-content" />
}
