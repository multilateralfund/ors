'use client'
import React from 'react'

import MUIThemeProvider from '@mui/material/styles/ThemeProvider'
import usePrevious from '@ors/hooks/usePrevious'
import useStore from '@ors/store'
import { theme } from '@ors/theme'

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const themeManager = useStore((state) => ({
    theme: state.theme,
    setTheme: state.setTheme,
  }))
  const prevTheme = usePrevious(themeManager.theme)

  React.useEffect(() => {
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches
    if (themeManager.theme || prefersDark) {
      document.documentElement.setAttribute(
        'data-mode',
        themeManager.theme || 'dark',
      )
    }
    if (!themeManager.theme && prefersDark) {
      themeManager.setTheme('dark')
    }
  }, [themeManager, prevTheme])

  return <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>
}
