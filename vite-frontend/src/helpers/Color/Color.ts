import type { PaletteColorOptions } from '@mui/material'
import { ColorRecordType } from '@ors/types/tailwind'

import resolveConfig from 'tailwindcss/resolveConfig'

import { warning } from '@ors/helpers/Log/Log'
import tailwindConfigModule from 'tailwind-config'

const tailwindConfig = resolveConfig(tailwindConfigModule)

type rgb = [r: number, g: number, b: number]

// https://stackoverflow.com/a/11508164/406269
function hexToRgb(hex: string): rgb {
  const bigint = parseInt(hex, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255

  return [r, g, b]
}

function htmlHexToRgb(colorString: string) {
  const noLeadingHash = colorString.slice(1)
  const cs =
    noLeadingHash.length === 3
      ? `${noLeadingHash[0]}${noLeadingHash[0]}${noLeadingHash[1]}${noLeadingHash[1]}${noLeadingHash[2]}${noLeadingHash[2]}`
      : noLeadingHash
  return hexToRgb(cs)
}

function colorForLuminance(n: number): number {
  return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
}

function rgbForLuminance([r, g, b]: rgb): rgb {
  return [
    colorForLuminance(r / 255),
    colorForLuminance(g / 255),
    colorForLuminance(b / 255),
  ]
}

function colorLuminance(color: rgb): number {
  const [R, G, B] = rgbForLuminance(color)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

function contrastFromLuminance(l1: number, l2: number) {
  return (l1 + 0.05) / (l2 + 0.05)
}

// https://www.w3.org/TR/WCAG20-TECHS/G18.html
function colorContrast(color1: string, color2: string) {
  const l1 = colorLuminance(htmlHexToRgb(color1))
  const l2 = colorLuminance(htmlHexToRgb(color2))
  return l1 > l2 ? contrastFromLuminance(l1, l2) : contrastFromLuminance(l2, l1)
}

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
  dark?: string
  light?: string
}) {
  warning(
    background,
    `getContrastText: missing background argument in getContrastText(${background}).`,
  )

  if (contrast) {
    return contrast
  }

  const darkContrast = colorContrast(background, dark) || 0
  const lightContrast = colorContrast(background, light) || 0

  return darkContrast >= lightContrast ? dark : light
}
