'use client'
import { usePathname } from 'next/navigation'

import Loading from '@ors/app/loading'
import config from '@ors/registry'
import useStore from '@ors/store'

import DashboardView from './DashboardView'
import DefaultView from './DefaultView'

export default function View({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user)
  const pathname = usePathname()
  const isGuardedRoute = !config.settings.unguardedRoutes.includes(pathname)

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
