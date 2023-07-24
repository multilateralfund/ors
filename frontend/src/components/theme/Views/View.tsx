'use client'
import type { ByLayout } from '@ors/config/Views'

import React from 'react'

import { usePathname } from 'next/navigation'

import config from '@ors/config'
import { getCurrentView } from '@ors/helpers'

const getViewByLayout = (layout?: keyof ByLayout) => {
  return layout ? config.views.layoutViews[layout] : null
}

const getViewDefault = () => {
  return config.views.default
}

export default function View({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const view = React.useMemo(() => getCurrentView(pathname), [pathname])

  const RenderedView = getViewByLayout(view?.layout) || getViewDefault()

  return <RenderedView>{children}</RenderedView>
}
