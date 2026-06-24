'use client'

import React, { useEffect } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import { useStore } from '@ors/store'

export default function PrintView({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user?.data)

  useEffect(() => {
    document.documentElement.setAttribute('data-printing', 'yes')
  }, [])

  return (
    <>
      {!user && <Loading className="bg-action-disabledBackground" />}
      <main className="grid-cols-1">{children}</main>
    </>
  )
}
