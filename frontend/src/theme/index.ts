// @ts-nocheck
import { createTheme as MUICreateTheme } from '@mui/material/styles'
import tailwindConfigModule from '@ors/../tailwind.config.js'
import resolveConfig from 'tailwindcss/resolveConfig'

const tailwindConfig = resolveConfig(tailwindConfigModule)

const tailwindTheme = tailwindConfig.theme

const defaultPalette = {
  dark: {
    action: {
      active: '#fff',
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(255, 255, 255, 0.16)',
    },
    background: {
      default: '#fff',
      paper: '#fff',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
    text: {
      disabled: 'rgba(255, 255, 255, 0.5)',
      primary: '#fff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  light: {
    action: {
      active: 'rgba(0, 0, 0, 0.54)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: 'rgba(0, 0, 0, 0.08)',
    },
    background: {
      default: '#121212',
      paper: '#121212',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    text: {
      disabled: 'rgba(0, 0, 0, 0.38)',
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
  },
}

function getPalette(palette: any, mode = 'light') {
  let contrastText,
    main = '#000000'
  if (typeof palette === 'string') {
    main = palette
  }
  if (typeof palette === 'object') {
    main = palette[mode] || palette.DEFAULT || main
    contrastText = palette[`${mode}-contrast`] || palette.contrast || undefined
  }
  return {
    main,
    ...(contrastText ? { contrastText } : {}),
  }
}

function getColor(palette: any, mode = 'light', defaultValue: string): string {
  return palette?.[mode] || defaultValue
}

export const createTheme = (mode: 'dark' | 'light' = 'light') =>
  MUICreateTheme({
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'unset',
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            backgroundColor:
              mode === 'light' ? 'rgb(243 244 246)' : 'rgb(55 65 81)',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          list: {
            padding: 0,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: tailwindTheme?.boxShadow?.sm,
          },
        },
      },
    },
    palette: {
      background: {
        default:
          mode === 'light'
            ? tailwindTheme?.colors?.white
            : tailwindTheme?.colors?.gray?.[800],
        paper:
          mode === 'light'
            ? tailwindTheme?.colors?.white
            : tailwindTheme?.colors?.gray?.[800],
      },
      base: getPalette(tailwindTheme?.colors?.base, mode),
      mode,
      primary: getPalette(tailwindTheme?.colors?.primary, mode),
      secondary: getPalette(tailwindTheme?.colors?.secondary, mode),
      text: {
        primary: getColor(
          tailwindTheme?.colors?.base,
          mode,
          defaultPalette[mode].text.primary,
        ),
      },
    },
  })
