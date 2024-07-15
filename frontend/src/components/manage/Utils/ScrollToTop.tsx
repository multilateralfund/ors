import React, { useEffect, useState } from 'react'

import cx from 'classnames'

import { IoArrowUp } from 'react-icons/io5'

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
    <div className="fixed bottom-4 right-4 z-50 print:hidden">
      <button
        className={cx(
          'cursor-pointer rounded-lg border-none bg-primary p-3 font-bold uppercase text-mlfs-hlYellow opacity-0 shadow-2xl transition-all',
          { collapse: !isVisible, 'opacity-100': isVisible },
        )}
        onClick={scrollToTop}
      >
        <span className="flex items-center gap-x-2">
          Back to top
          <IoArrowUp size={16} />
        </span>
      </button>
    </div>
  )
}

export default ScrollToTop
