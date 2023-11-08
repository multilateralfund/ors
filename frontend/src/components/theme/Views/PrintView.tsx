'use client'

import React, { useEffect } from 'react'

export default function PrintView({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-printing', 'yes')
  }, [])

  return (
    <>
      <main className="grid-cols-1">{children}</main>
    </>
  )
}
