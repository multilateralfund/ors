import type { ThemeOptions } from '@mui/material'
import type { ThemeConfig } from '@ors/types/tailwind'

import { getPaletteColor } from '@ors/helpers'

const contrastThreshold = 4.5

const commonTheme = (
  tailwindTheme: ThemeConfig,
  direction: 'ltr' | 'rtl',
): ThemeOptions => ({
  components: {
    MuiMenu: {
      styleOverrides: {
        list: {
          padding: 0,
        },
      },
    },
  },
  direction,
  palette: {
    action: {
      active: 'rgba(0, 0, 0, 0.54)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: 'rgba(0, 0, 0, 0.08)',
    },
    background: {
      default: tailwindTheme.colors.white,
      paper: tailwindTheme.colors.white,
    },
    common: {
      black: tailwindTheme.colors.black,
      white: tailwindTheme.colors.white,
    },
    contrastThreshold,
    divider: 'rgba(0, 0, 0, 0.12)',
    error: getPaletteColor(tailwindTheme.colors.error),
    grey: tailwindTheme.colors.gray,
    info: getPaletteColor(tailwindTheme.colors.info),
    primary: getPaletteColor(tailwindTheme.colors.primary),
    secondary: getPaletteColor(tailwindTheme.colors.secondary),
    success: getPaletteColor(tailwindTheme.colors.success),
    text: {
      disabled: 'rgba(0, 0, 0, 0.38)',
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
    warning: getPaletteColor(tailwindTheme.colors.warning),
  },
  typography: {
    body1: {
      fontSize: tailwindTheme.fontSize['base'][0],
    },
    body2: {
      fontSize: tailwindTheme.fontSize['sm'][0],
    },
    button: {
      fontSize: tailwindTheme.fontSize['sm'][0],
      textTransform: 'unset',
    },
    caption: {
      fontSize: tailwindTheme.fontSize['xs'][0],
    },
    fontFamily: 'inherit',
    h1: {
      fontSize: tailwindTheme.fontSize['6xl'][0],
      fontWeight: 'bold',
    },
    h2: {
      fontSize: tailwindTheme.fontSize['5xl'][0],
      fontWeight: 'bold',
    },
    h3: {
      fontSize: tailwindTheme.fontSize['4xl'][0],
      fontWeight: 'bold',
    },
    h4: {
      fontSize: tailwindTheme.fontSize['3xl'][0],
      fontWeight: 'bold',
    },
    h5: {
      fontSize: tailwindTheme.fontSize['2xl'][0],
      fontWeight: 'bold',
    },
    h6: {
      fontSize: tailwindTheme.fontSize['xl'][0],
      fontWeight: 'bold',
    },
    overline: {
      fontSize: tailwindTheme.fontSize['sm'][0],
    },
    subtitle1: {
      fontSize: tailwindTheme.fontSize['base'][0],
    },
    subtitle2: {
      fontSize: tailwindTheme.fontSize['sm'][0],
    },
  },
})

export default commonTheme
