// @ts-nocheck
import {
  createTheme as MuiCreateTheme,
  responsiveFontSizes,
} from '@mui/material/styles'
import resolveConfig from 'tailwindcss/resolveConfig'

import tailwindConfigModule from '~/tailwind.config'

const tailwindConfig = resolveConfig(tailwindConfigModule)

export const tailwindTheme = tailwindConfig.theme

import themes from './theme'

export const createTheme = (mode: 'dark' | 'light' = 'light') => {
  return responsiveFontSizes(
    MuiCreateTheme(
      themes[mode]({
        ...tailwindTheme,
        originalColors: tailwindConfig.originalColors[mode],
      }),
    ),
  )
}
