'use client'
import React from 'react'

import MUIThemeProvider from '@mui/material/styles/ThemeProvider'

import useStore from '@ors/store'
import { createTheme } from '@ors/theme'

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const themeManager = useStore((state) => ({
    setTheme: state.setTheme,
    theme: state.theme,
  }))

  const currentTheme = React.useMemo(() => {
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    if (!themeManager.theme && prefersDark) {
      return 'dark'
    }
    return themeManager.theme || 'light'
  }, [themeManager.theme])

  React.useEffect(() => {
    document.documentElement.setAttribute('data-mode', currentTheme)
    if (!themeManager.theme) {
      themeManager.setTheme(currentTheme)
    }
  }, [currentTheme, themeManager])

  return (
    <MUIThemeProvider theme={createTheme(currentTheme)}>
      {children}
    </MUIThemeProvider>
  )
}
