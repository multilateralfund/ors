'use client'

import React from 'react'

export default function DefaultView({
  children,
}: {
  children: React.ReactNode
}) {
  React.useEffect(() => {
    window.requestAnimationFrame(() => {
      document.documentElement.setAttribute('data-layout', 'document')
    })
  }, [])

  return <main className="grid-cols-1">{children}</main>
}
