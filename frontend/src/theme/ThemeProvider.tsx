'use client'
import MUIThemeProvider from '@mui/material/styles/ThemeProvider'
import { theme } from '@ors/theme'

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>
}
