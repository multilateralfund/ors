'use client'
import React from 'react'

import { usePathname, useRouter } from 'next/navigation'

import Print from '@ors/components/manage/Utils/Print'
import Footer from '@ors/components/theme/Footer/AuthorizedFooter'
import Header from '@ors/components/theme/Header/AuthorizedHeader'
import Loading from '@ors/components/theme/Loading/Loading'
import { useStore } from '@ors/store'

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

  return (
    <>
      {!user && <Loading className="bg-action-disabledBackground" />}
      <Print />
      <Header />
      <main className="grid-cols-[auto]">
        <div className="content grid grid-rows-[auto_1fr_auto]">
          <div id="top-control" className="not-printable z-10" />
          <div className="page-content-wrapper">{children}</div>
          <div id="bottom-control" className="not-printable z-10" />
        </div>
      </main>
      <Footer />
    </>
  )
}
