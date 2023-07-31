'use client'
import React from 'react'

import { usePathname, useRouter } from 'next/navigation'

import Sidebar from '@ors/components/theme/Sidebar/Sidebar'
import useStore from '@ors/store'

export default function AuthorizedView({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const user = useStore((state) => state.user?.data)

  React.useEffect(() => {
    if (!user) {
      router.push(
        pathname && pathname !== '/' ? `/login?redirect=${pathname}` : '/login',
      )
    }
  }, [user, pathname, router])

  React.useEffect(() => {
    window.requestAnimationFrame(() => {
      document.documentElement.setAttribute(
        'data-layout',
        'authorized_document',
      )
    })
  }, [])

  return (
    !!user && (
      <main className="grid-cols-[auto_1fr]">
        <Sidebar />
        <div className="content grid grid-rows-[auto_1fr_auto] overflow-y-hidden">
          <div id="top-control" className="z-10" />
          <div className="page-content-wrapper overflow-y-auto">{children}</div>
          <div id="bottom-control" className="z-10" />
        </div>
      </main>
    )
  )
}
