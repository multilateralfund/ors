import type { ThemeOptions } from '@mui/material'
import type { ThemeConfig } from '@ors/types/tailwind'

import darkScrollbar from '@mui/material/darkScrollbar'

import getCommonTheme from '../common'

const lightTheme = (
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
            active: tailwindTheme.colors.gray[400],
            thumb: tailwindTheme.colors.gray[300],
            track: tailwindTheme.colors.gray[50],
          }),
        },
      },
    },
    palette: {
      ...commonTheme.palette,
      mode: 'light',
    },
  }
}

export default lightTheme
