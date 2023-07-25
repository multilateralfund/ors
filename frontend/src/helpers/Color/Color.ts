// MUI getContrastText
// REF: https://github.com/mui-org/material-ui/blob/ec37e2bb3c904d9552fa819425ee1eef72914996/packages/material-ui/src/styles/createPalette.js#L104

import type { PaletteColorOptions } from '@mui/material'

import { ColorRecordType } from '@ors/types/tailwind'

import { warning } from '../Log/Log'

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
  contrastThreshold = 4.5,
  dark,
  light,
}: {
  background: string
  contrast?: string
  contrastThreshold?: number
  dark: string
  light: string
}) {
  warning(
    background,
    `Material-UI: missing background argument in getContrastText(${background}).`,
  )

  const contrastText =
    !!dark && !!light
      ? getContrastRatio(background, dark) >= contrastThreshold
        ? dark
        : light
      : contrast || '#ffffff'

  if (process.env.NODE_ENV !== 'production') {
    const contrast = getContrastRatio(background, contrastText)
    warning(
      contrast >= 3,
      [
        `Material-UI: the contrast ratio of ${contrast}:1 for ${contrastText} on ${background}`,
        'falls below the WACG recommended absolute minimum contrast ratio of 3:1.',
        'https://www.w3.org/TR/2008/REC-WCAG20-20081211/#visual-audio-contrast-contrast',
      ].join('\n'),
    )
  }

  return contrastText
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
