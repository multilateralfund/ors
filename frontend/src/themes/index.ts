// @ts-nocheck
import {
  createTheme as MuiCreateTheme,
  responsiveFontSizes,
} from '@mui/material/styles'
import tailwindConfigModule from '@ors/../tailwind.config.js'
import resolveConfig from 'tailwindcss/resolveConfig'

const tailwindConfig = resolveConfig(tailwindConfigModule)

export const tailwindTheme = tailwindConfig.theme

import themes from './theme'

export const createTheme = (
  mode: 'dark' | 'light' = 'light',
  direction: 'ltr' | 'rtl',
) => {
  return responsiveFontSizes(
    MuiCreateTheme(themes[mode](tailwindTheme, direction)),
  )
}
