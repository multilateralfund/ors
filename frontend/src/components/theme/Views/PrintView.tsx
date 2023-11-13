'use client'

import React, { useEffect } from 'react'

import { usePathname, useRouter } from 'next/navigation'

import useStore from '@ors/store'

export default function PrintView({ children }: { children: React.ReactNode }) {
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

  useEffect(() => {
    document.documentElement.setAttribute('data-printing', 'yes')
  }, [])

  return !!user && <main className="grid-cols-1">{children}</main>
}
