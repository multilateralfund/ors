import type { ThemeOptions } from '@mui/material'
import type { ThemeConfig } from '@ors/types/tailwind'

import { darkScrollbar } from '@mui/material'

import getCommonTheme from '../common'

const darkTheme = (
  tailwindTheme: ThemeConfig,
  direction: 'ltr' | 'rtl',
): ThemeOptions => {
  const commonTheme = getCommonTheme(tailwindTheme, direction)

  return {
    ...commonTheme,
    components: {
      ...commonTheme.components,
      MuiCssBaseline: {
        styleOverrides: {
          body: darkScrollbar({
            active: tailwindTheme.colors.gray[700],
            thumb: tailwindTheme.colors.gray[800],
            track: tailwindTheme.colors.gray[900],
          }),
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgb(55, 65, 81)',
            borderWidth: '1px',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderColor: tailwindTheme.colors.gray[700],
          },
        },
      },
    },
    palette: {
      ...commonTheme.palette,
      action: {
        active: '#fff',
        disabled: 'rgba(255, 255, 255, 0.3)',
        disabledBackground: 'rgba(255, 255, 255, 0.3)',
        hover: 'rgba(255, 255, 255, 0.08)',
        selected: 'rgba(255, 255, 255, 0.16)',
      },
      background: {
        default: tailwindTheme.colors.gray[900],
        paper: tailwindTheme.colors.gray[900],
      },
      divider: 'rgba(255, 255, 255, 0.12)',
      mode: 'dark',
      text: {
        disabled: 'rgba(255, 255, 255, 0.5)',
        primary: tailwindTheme.colors.white,
        secondary: 'rgba(255, 255, 255, 0.7)',
      },
    },
  }
}

export default darkTheme
