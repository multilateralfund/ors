'use client'
import React from 'react'

// import { isEmpty, omitBy } from 'lodash'
import { usePathname } from 'next/navigation'

import Loading from '@ors/app/loading'
import config from '@ors/config'
import useStore from '@ors/store'

import DashboardView from './DashboardView'
import DefaultView from './DefaultView'

export default function View({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user)
  const pathname = usePathname()
  const isGuardedRoute = !config.settings.unguardedRoutes.includes(pathname)

  // React.useEffect(() => {
  //   omitBy({}, isEmpty)
  // })

  function getView() {
    if (isGuardedRoute && !!user.data) {
      return DashboardView
    }
    if (isGuardedRoute && !user.data) {
      return Loading
    }
    return DefaultView
  }

  const RenderView = getView() || null

  return <RenderView>{children}</RenderView>
}
