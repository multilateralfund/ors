'use client'
import type { ByError, ByLayout } from '@ors/config/Views'

import React, { useEffect, useMemo } from 'react'
import { browserName } from 'react-device-detect'

import { usePathname } from 'next/navigation'
import { SnackbarProvider } from 'notistack'

import config from '@ors/config'

import ScrollToTop from '@ors/components/manage/Utils/ScrollToTop'
import DefaultAlert from '@ors/components/theme/Alerts/Default'
import { getCurrentView } from '@ors/helpers/View/View'
import { useStore } from '@ors/store'

const localStorageVersion = '1.0.2'

const getViewByLayout = (layout?: keyof ByLayout) => {
  return layout ? config.views.layoutViews[layout] : null
}

const getViewDefault = () => {
  return config.views.default
}

export const getErrorView = (error?: keyof ByError) => {
  return error ? config.views.errorViews[error] : null
}

export default function View({ children }: { children: React.ReactNode }) {
  const internalError = useStore((state) => state.internalError)
  const errorName = useStore((state) => state.internalError?.status)
  const pathname = usePathname()

  const view = getCurrentView(pathname)

  // const RenderedView: React.FC<any> = useMemo(
  //   () =>
  //     getErrorView(errorName) ||
  //     getViewByLayout(view.layout) ||
  //     getViewDefault(),
  //   [view, errorName],
  // )

  const RenderedView: React.FC<any> = useMemo(
    () => getViewByLayout(view.layout) || getViewDefault(),
    [view],
  )

  useEffect(() => {
    if (localStorage.getItem('version') !== localStorageVersion) {
      localStorage.clear()
      localStorage.setItem('version', localStorageVersion)
    }
    document.documentElement.setAttribute('data-browser', browserName)
  }, [])

  useEffect(() => {
    window.requestAnimationFrame(() => {
      const hasInternalError = !!getErrorView(errorName)
      document.documentElement.setAttribute(
        'data-layout',
        hasInternalError ? 'error' : view.layout,
      )
    })
  }, [view.layout, errorName])

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
      <RenderedView error={internalError?._info}>{children}</RenderedView>
      <ScrollToTop />
    </SnackbarProvider>
  )
}
