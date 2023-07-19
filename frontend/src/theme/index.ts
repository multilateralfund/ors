// @ts-nocheck
import resolveConfig from 'tailwindcss/resolveConfig'

import { createTheme } from '@mui/material/styles'
import tailwindConfigModule from '@ors/../tailwind.config.js'

const tailwindConfig = resolveConfig(tailwindConfigModule)

const tailwindTheme = tailwindConfig.theme || {}

function getPalette(color, contrastText, defaultColor = '#000') {
  if (typeof color === 'string') {
    return {
      main: color,
      contrastText,
    }
  }
  if (typeof color === 'object') {
    return {
      main: color.DEFAULT,
      light: color.light,
      dark: color.dark,
      contrastText,
    }
  }
  return {
    main: defaultColor,
    contrastText,
  }
}

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: getPalette(
      tailwindTheme.colors?.primary,
      '#fff',
      tailwindTheme.colors?.blue?.[500],
    ),
    secondary: getPalette(
      tailwindTheme.colors?.secondary,
      '#fff',
      tailwindTheme.colors?.gray?.[500],
    ),
  },
})
