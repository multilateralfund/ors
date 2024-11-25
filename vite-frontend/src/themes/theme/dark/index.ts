import type { ThemeOptions } from '@mui/material'
import type { ThemeConfig } from '@ors/types/tailwind'

import { darkScrollbar } from '@mui/material'

import getCommonTheme from '../common'

const darkTheme = (tailwindTheme: ThemeConfig): ThemeOptions => {
  const commonTheme = getCommonTheme(tailwindTheme)

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
    },
    palette: {
      ...commonTheme.palette,
      mode: 'dark',
    },
  }
}

export default darkTheme
