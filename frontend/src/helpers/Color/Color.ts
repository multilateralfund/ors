// MUI getContrastText
// REF: https://github.com/mui-org/material-ui/blob/ec37e2bb3c904d9552fa819425ee1eef72914996/packages/material-ui/src/styles/createPalette.js#L104

import type { PaletteColorOptions } from '@mui/material'
import { ColorRecordType } from '@ors/types/tailwind'

import chroma from 'chroma-js'
import resolveConfig from 'tailwindcss/resolveConfig'

import { warning } from '@ors/helpers/Log/Log'

const tailwindConfigModule = require('~/tailwind.config')
const tailwindConfig = resolveConfig(tailwindConfigModule)

const contrastColors: any = {}

export function getPaletteColor(color: ColorRecordType): PaletteColorOptions {
  const { DEFAULT, contrastText, dark, light } = color
  return {
    main: DEFAULT || color[500],
    ...(light ? { light } : {}),
    ...(dark ? { dark } : {}),
    ...(contrastText ? { contrastText } : {}),
  }
}
export function getContrastText({
  background,
  contrast,
  dark = tailwindConfig.theme.colors.black,
  light = tailwindConfig.theme.colors.white,
}: {
  background: string
  contrast?: string
  contrastThreshold?: number
  dark?: string
  light?: string
}) {
  warning(
    background,
    `Material-UI: missing background argument in getContrastText(${background}).`,
  )

  if (contrast) {
    return contrast
  }

  const darkContrast = chroma.contrast(background, dark) || 0
  const lightContrast = chroma.contrast(background, light) || 0

  return darkContrast >= lightContrast ? dark : light
}

export function getContrastColor(background: any) {
  // Generate a random color
  if (contrastColors[background]) {
    return contrastColors[background]
  }
  let color,
    lastContrast = 0,
    iterations = 0
  do {
    const randomColor = chroma.random().hex()
    const randomColorContrast = chroma.contrast(randomColor, background)
    if (randomColorContrast > lastContrast) {
      color = randomColor
      lastContrast = randomColorContrast
    }
    iterations++
  } while (lastContrast < 7 && iterations < 5)
  contrastColors[background] = color
  return color
}

export function getContrastTextForPaletteColor(
  color: ColorRecordType,
  contrastThreshold: number,
): string {
  return getContrastText({
    background: color.DEFAULT || color[500] || '#000000',
    contrast: color.contrast,
    contrastThreshold,
    dark: color.dark || color[700],
    light: color.light || color[300],
  })
}

export function getContrastRatio(foreground: string, background: string) {
  warning(
    foreground,
    `Material-UI: missing foreground argument in getContrastRatio(${foreground}, ${background}).`,
  )
  warning(
    background,
    `Material-UI: missing background argument in getContrastRatio(${foreground}, ${background}).`,
  )

  const lumA = getLuminance(foreground)
  const lumB = getLuminance(background)
  return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05)
}

export function getLuminance(color: string) {
  warning(
    color,
    `Material-UI: missing color argument in getLuminance(${color}).`,
  )

  const decomposedColor = decomposeColor(color)

  if (decomposedColor.type.indexOf('rgb') !== -1) {
    const rgb = decomposedColor.values.map((val: number) => {
      val /= 255 // normalized
      return val <= 0.03928 ? val / 12.92 : ((val + 0.055) / 1.055) ** 2.4
    })
    // Truncate at 3 digits
    return Number(
      (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]).toFixed(3),
    )
  }

  // else if (decomposedColor.type.indexOf('hsl') !== -1)
  return decomposedColor.values[2] / 100
}

export function decomposeColor(color: string) {
  if (color.charAt(0) === '#') {
    return decomposeColor(convertHexToRGB(color))
  }

  const marker = color.indexOf('(')
  const type = color.substring(0, marker)
  const values = color.substring(marker + 1, color.length - 1).split(',')
  const parsedValues = values.map((value) => parseFloat(value))

  if (__DEVELOPMENT__) {
    if (['rgb', 'rgba', 'hsl', 'hsla'].indexOf(type) === -1) {
      throw new Error(
        [
          `Material-UI: unsupported \`${color}\` color.`,
          'We support the following formats: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla().',
        ].join('\n'),
      )
    }
  }

  return { type, values: parsedValues }
}

export function convertHexToRGB(color: string) {
  const parsedColor = color.substring(1)

  const re = new RegExp(`.{1,${parsedColor.length / 3}}`, 'g')
  let colors = parsedColor.match(re)

  if (colors && colors[0].length === 1) {
    // @ts-ignore
    colors = colors.map((n) => n + n)
  }

  return colors ? `rgb(${colors.map((n) => parseInt(n, 16)).join(', ')})` : ''
}

export function convertHexToRGBA(color: string, opacity: number = 1) {
  const parsedColor = color.substring(1)

  const re = new RegExp(`.{1,${parsedColor.length / 3}}`, 'g')
  let colors = parsedColor.match(re)

  if (colors && colors[0].length === 1) {
    // @ts-ignore
    colors = colors.map((n) => n + n)
  }

  return colors
    ? `rgba(${colors.map((n) => parseInt(n, 16)).join(', ')}, ${opacity})`
    : ''
}
