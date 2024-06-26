import React, { useEffect, useState } from 'react'

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({
      behavior: 'smooth',
      top: 0,
    })
  }

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility)
    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isVisible && (
        <button
          className="rounded-lg bg-secondary p-3 text-white hover:bg-blue-700 cursor-pointer"
          onClick={scrollToTop}
        >
          Back to top
        </button>
      )}
    </div>
  )
}

export default ScrollToTop
