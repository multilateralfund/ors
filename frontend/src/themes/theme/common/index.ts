import type { ThemeOptions } from '@mui/material'
import type { ThemeConfig } from '@ors/types/tailwind'

import { getPaletteColor } from '@ors/helpers/Color/Color'

type TypographyType =
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'
  | '7xl'
  | '8xl'
  | '9xl'
  | 'base'
  | 'lg'
  | 'sm'
  | 'xl'
  | 'xs'

const contrastThreshold = 4.5

const commonTheme = (
  tailwindTheme: ThemeConfig,
  direction: 'ltr' | 'rtl',
): ThemeOptions => {
  function getTypography(size: TypographyType) {
    return {
      fontSize: tailwindTheme.fontSize[size][0],
      // lineHeight: tailwindTheme.fontSize[size][1].lineHeight,
    }
  }
  return {
    breakpoints: {
      values: {
        '2xl': parseInt(tailwindTheme.screens['2xl'].replace('px', '')),
        lg: parseInt(tailwindTheme.screens.lg.replace('px', '')),
        md: parseInt(tailwindTheme.screens.md.replace('px', '')),
        sm: parseInt(tailwindTheme.screens.sm.replace('px', '')),
        xl: parseInt(tailwindTheme.screens.xl.replace('px', '')),
        xs: 0,
      },
    },
    components: {
      MuiDivider: {
        defaultProps: {
          className: 'bg-red',
        },
      },
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
        default: tailwindTheme.originalColors.mui.default.background,
        paper: tailwindTheme.originalColors.mui.paper.background,
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
        ...getTypography('base'),
      },
      body2: {
        ...getTypography('sm'),
      },
      button: {
        ...getTypography('sm'),
        textTransform: 'unset',
      },
      caption: {
        ...getTypography('xs'),
      },
      fontFamily: 'inherit',
      h1: {
        ...getTypography('6xl'),
        fontWeight: 'bold',
      },
      h2: {
        ...getTypography('5xl'),
        fontWeight: 'bold',
      },
      h3: {
        ...getTypography('4xl'),
        fontWeight: 'bold',
      },
      h4: {
        ...getTypography('3xl'),
        fontWeight: 'bold',
      },
      h5: {
        ...getTypography('2xl'),
        fontWeight: 'bold',
      },
      h6: {
        ...getTypography('xl'),
        fontWeight: 'bold',
      },
      overline: {
        ...getTypography('sm'),
      },
      subtitle1: {
        ...getTypography('base'),
      },
      subtitle2: {
        ...getTypography('sm'),
      },
    },
  }
}

export default commonTheme
