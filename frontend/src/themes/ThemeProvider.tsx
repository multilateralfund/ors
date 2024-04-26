'use client'

import type { Options as OptionsOfCreateCache } from '@emotion/cache'
import { ThemeSlice } from '@ors/types/store'

import React, { useEffect, useMemo } from 'react'

import { CssBaseline } from '@mui/material'
import MuiThemeProvider from '@mui/material/styles/ThemeProvider'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { prefixer } from 'stylis'

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
  const theme: ThemeSlice = useStore((state) => state.theme)

  const muiTheme = useMemo(() => {
    return createTheme(theme.mode || 'light')
  }, [theme.mode])

  const currentTheme = React.useMemo(() => theme.mode || 'light', [theme.mode])

  useEffect(() => {
    document.documentElement.setAttribute('data-ssr', 'no')
  }, [])

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
        stylisPlugins: [prefixer],
      }}
    >
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline enableColorScheme />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {children}
        </LocalizationProvider>
      </MuiThemeProvider>
    </AppRouterCacheProvider>
  )
}
