'use client'

import type { Options as OptionsOfCreateCache } from '@emotion/cache'
import { ThemeSlice } from '@ors/types/store'

import React, { useEffect, useMemo, useRef, useState } from 'react'

import { CssBaseline } from '@mui/material'
import MuiThemeProvider from '@mui/material/styles/ThemeProvider'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { union } from 'lodash'
import { prefixer } from 'stylis'
import rtlPlugin from 'stylis-plugin-rtl'

import LoadingBuffer from '@ors/components/theme/Loading/LoadingBuffer'
import Trans from '@ors/components/ui/Trans/Trans'
import { useStore } from '@ors/store'
import { createTheme } from '@ors/themes'

export default function ThemeProvider({
  children,
  options,
}: {
  children: React.ReactNode
  options: Partial<OptionsOfCreateCache> & {
    enableCssLayer?: boolean
  }
}) {
  const [loadingDir, setLoadingDir] = useState<boolean>(false)
  const theme: ThemeSlice = useStore((state) => state.theme)
  const dir = useStore((state) => state.i18n.dir)
  const prevDir = useRef(dir)

  const muiTheme = useMemo(() => {
    return createTheme(theme.mode || 'light', dir)
  }, [theme.mode, dir])

  const currentTheme = React.useMemo(() => theme.mode || 'light', [theme.mode])

  useEffect(() => {
    document.documentElement.setAttribute('data-ssr', 'no')
  }, [])

  useEffect(() => {
    if (dir !== prevDir.current) {
      setLoadingDir(true)
    }
    prevDir.current = dir
  }, [dir])

  useEffect(() => {
    if (loadingDir) {
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  }, [loadingDir])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme)
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    if (!theme.mode) {
      const newMode = prefersDark ? 'dark' : currentTheme
      theme.setMode?.(newMode)
    }
  }, [currentTheme, theme])

  return (
    <AppRouterCacheProvider
      options={{
        ...options,
        stylisPlugins: union([prefixer], dir === 'rtl' ? [rtlPlugin] : []),
      }}
    >
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline enableColorScheme />
        {loadingDir && (
          <LoadingBuffer
            style={{ backgroundColor: muiTheme.palette.background.default }}
            text={<Trans id="update-dir">Updating language direction</Trans>}
            time={350}
          />
        )}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {children}
        </LocalizationProvider>
      </MuiThemeProvider>
    </AppRouterCacheProvider>
  )
}
