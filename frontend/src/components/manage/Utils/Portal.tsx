'use client'
import { createPortal } from 'react-dom'

export default function Portal({
  key,
  active = true,
  children,
  domNode,
}: {
  active?: boolean
  children: React.ReactNode
  domNode?: DocumentFragment | Element | string
  key?: null | string
}) {
  if (__SERVER__ || !domNode || !active) return children
  if (typeof domNode === 'string') {
    const element = document.getElementById(domNode)
    if (element) {
      return createPortal(children, element, key)
    }
    return null
  }
  return createPortal(children, domNode, key)
}
