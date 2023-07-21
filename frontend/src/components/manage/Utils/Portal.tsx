'use client'
import { createPortal } from 'react-dom'

export default function Portal({
  children,
  domNode,
  key,
}: {
  children: React.ReactNode
  domNode?: DocumentFragment | Element | string
  key?: null | string
}) {
  if (typeof window === 'undefined' || !domNode) return children
  if (typeof domNode === 'string') {
    const element = document.getElementById(domNode)
    if (element) {
      return createPortal(children, element, key)
    }
    return children
  }
  return createPortal(children, domNode, key)
}
