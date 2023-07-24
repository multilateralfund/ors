import type { ThemeOptions } from '@mui/material'
import type { ThemeConfig } from '@ors/@types/tailwind'

import darkScrollbar from '@mui/material/darkScrollbar'

import getCommonTheme from '../common'

const lightTheme = (tailwindTheme: ThemeConfig): ThemeOptions => {
  const commonTheme = getCommonTheme(tailwindTheme)
  return {
    ...commonTheme,
    components: {
      ...commonTheme.components,
      MuiCssBaseline: {
        styleOverrides: {
          body: darkScrollbar({
            active: tailwindTheme.colors.gray[400],
            thumb: tailwindTheme.colors.gray[300],
            track: tailwindTheme.colors.gray[50],
          }),
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgb(243, 244, 246)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderColor: tailwindTheme.colors.gray[200],
          },
        },
      },
    },
    palette: {
      ...commonTheme.palette,
      background: {
        default: tailwindTheme.colors.gray[50],
        paper: tailwindTheme.colors.white,
      },
      mode: 'light',
    },
  }
}

export default lightTheme
