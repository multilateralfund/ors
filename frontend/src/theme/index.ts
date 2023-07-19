// @ts-nocheck
import resolveConfig from 'tailwindcss/resolveConfig'

import { createTheme as MUICreateTheme } from '@mui/material/styles'
import tailwindConfigModule from '@ors/../tailwind.config.js'

const tailwindConfig = resolveConfig(tailwindConfigModule)

const tailwindTheme = tailwindConfig.theme

const defaultPalette = {
  light: {
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
    action: {
      active: 'rgba(0, 0, 0, 0.54)',
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: 'rgba(0, 0, 0, 0.08)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
    },
    background: {
      default: '#121212',
      paper: '#121212',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  dark: {
    text: {
      primary: '#fff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)',
    },
    action: {
      active: '#fff',
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(255, 255, 255, 0.16)',
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
    },
    background: {
      default: '#fff',
      paper: '#fff',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
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

export const createTheme = (mode: 'light' | 'dark' = 'light') =>
  MUICreateTheme({
    palette: {
      mode,
      primary: getPalette(tailwindTheme?.colors?.primary, mode),
      secondary: getPalette(tailwindTheme?.colors?.secondary, mode),
      base: getPalette(tailwindTheme?.colors?.base, mode),
      text: {
        primary: getColor(
          tailwindTheme?.colors?.base,
          mode,
          defaultPalette[mode].text.primary,
        ),
      },
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
    },
  })
