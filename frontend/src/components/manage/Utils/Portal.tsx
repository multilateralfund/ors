'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function Portal({
  key,
  children,
  domNode,
}: {
  children: React.ReactNode
  domNode?: DocumentFragment | Element | string
  key?: null | string
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!domNode) return children
  if (__SERVER__ || !mounted) return null
  if (typeof domNode === 'string') {
    const element = document.getElementById(domNode)
    if (element) {
      return createPortal(children, element, key)
    }
    return null
  }
  return createPortal(children, domNode, key)
}
