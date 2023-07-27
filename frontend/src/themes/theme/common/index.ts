import type { ThemeOptions } from '@mui/material'
import type { ThemeConfig } from '@ors/types/tailwind'

import { getPaletteColor } from '@ors/helpers'

const contrastThreshold = 4.5

const commonTheme = (
  tailwindTheme: ThemeConfig,
  direction: 'ltr' | 'rtl',
): ThemeOptions => {
  return {
    components: {
      MuiMenu: {
        styleOverrides: {
          list: {
            padding: 0,
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            transform: 'scale(1)',
            transformOrigin: 'top',
          },
        },
      },
    },
    direction,
    palette: {
      action: {
        active: tailwindTheme.originalColors.action.active,
        disabled: tailwindTheme.originalColors.action.disabled,
        disabledBackground:
          tailwindTheme.originalColors.action.disabledBackground,
        hover: tailwindTheme.originalColors.action.hover,
        selected: tailwindTheme.originalColors.action.selected,
      },
      background: {
        default: tailwindTheme.originalColors.background.DEFAULT,
        paper: tailwindTheme.originalColors.background.paper,
      },
      common: {
        black: tailwindTheme.colors.black,
        white: tailwindTheme.colors.white,
      },
      contrastThreshold,
      divider: tailwindTheme.originalColors.divider.DEFAULT,
      error: getPaletteColor(tailwindTheme.originalColors.error),
      grey: tailwindTheme.colors.gray,
      info: getPaletteColor(tailwindTheme.originalColors.info),
      primary: getPaletteColor(tailwindTheme.originalColors.primary),
      secondary: getPaletteColor(tailwindTheme.originalColors.secondary),
      success: getPaletteColor(tailwindTheme.originalColors.success),
      text: {
        disabled: tailwindTheme.originalColors.typography.disabled,
        primary: tailwindTheme.originalColors.typography.primary,
        secondary: tailwindTheme.originalColors.typography.secondary,
      },
      warning: getPaletteColor(tailwindTheme.originalColors.warning),
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
  }
}

export default commonTheme
