'use client'
import { usePathname } from 'next/navigation'

import config from '@ors/registry'
import useStore from '@ors/store'

import DashboardView from './DashboardView'
import DefaultView from './DefaultView'

export default function View({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user)
  const pathname = usePathname()
  const isGuardedRoute = !config.settings.unguardedRoutes.includes(pathname)

  function getView() {
    if (isGuardedRoute && user) {
      return DashboardView
    }
    return DefaultView
  }

  const RenderView = getView() || null

  return <RenderView>{children}</RenderView>
}
