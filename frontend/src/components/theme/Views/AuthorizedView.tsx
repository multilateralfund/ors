'use client'
import React from 'react'

import { Button } from '@mui/material'
import { usePathname, useRouter } from 'next/navigation'

import Portal from '@ors/components/manage/Utils/Portal'
import Sidebar from '@ors/components/theme/Sidebar/Sidebar'
import useStore from '@ors/store'

import { IoMenu } from '@react-icons/all-files/io5/IoMenu'

export default function AuthorizedView({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const user = useStore((state) => state.user?.data)
  const controls = useStore((state) => state.controls)

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
      <main className="grid-cols-[auto] md:grid-cols-[auto_1fr]">
        <Portal domNode="header-control">
          <Button
            className="portal md:hidden"
            onClick={() => controls.setSidebar()}
          >
            <IoMenu size={24} />
          </Button>
        </Portal>
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
