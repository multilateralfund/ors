'use client'
import type { ByLayout } from '@ors/config/Views'

import React, { useEffect, useMemo } from 'react'

import { usePathname } from 'next/navigation'
import { SnackbarProvider } from 'notistack'

import config from '@ors/config'

import DefaultAlert from '@ors/components/theme/Alerts/Default'
import { getCurrentView } from '@ors/helpers/View/View'

const getViewByLayout = (layout?: keyof ByLayout) => {
  return layout ? config.views.layoutViews[layout] : null
}

const getViewDefault = () => {
  return config.views.default
}

const localStorageVersion = '1.0.1'

export default function View({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const view = getCurrentView(pathname)

  const RenderedView = useMemo(
    () => getViewByLayout(view.layout) || getViewDefault(),
    [view],
  )

  useEffect(() => {
    if (localStorage.getItem('version') !== localStorageVersion) {
      localStorage.clear()
      localStorage.setItem('version', localStorageVersion)
    }
  }, [])

  useEffect(() => {
    window.requestAnimationFrame(() => {
      document.documentElement.setAttribute('data-layout', view.layout)
    })
  }, [view.layout])

  return (
    <SnackbarProvider
      maxSnack={3}
      Components={{
        default: DefaultAlert,
        error: DefaultAlert,
        info: DefaultAlert,
        success: DefaultAlert,
        warning: DefaultAlert,
      }}
    >
      <RenderedView>{children}</RenderedView>
    </SnackbarProvider>
  )
}
