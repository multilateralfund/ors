import React from 'react'

import { useLocation } from 'wouter'

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
  const [pathname, setLocation] = useLocation()
  const user = useStore((state) => state.user?.data)

  React.useEffect(() => {
    if (!user) {
      setLocation(
        pathname && pathname !== '/' ? `/login?redirect=${pathname}` : '/login',
      )
    }
  }, [user, pathname, setLocation])

  if (!user) {
    return <Loading className="bg-action-disabledBackground" />
  }

  return (
    <>
      <Print />
      <Header />
      <main className="grid-cols-[auto] print:block">
        <div className="content grid grid-rows-[auto_1fr_auto] print:block">
          <div id="top-control" className="not-printable z-10" />
          <div className="page-content-wrapper">{children}</div>
          <div id="bottom-control" className="not-printable z-10" />
        </div>
      </main>
      <Footer />
    </>
  )
}
