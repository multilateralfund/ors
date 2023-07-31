import type { DefaultColors } from 'tailwindcss/types/generated/colors'
import type { DefaultTheme } from 'tailwindcss/types/generated/default-theme'

type ColorIndex =
  | 50
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | DEFAULT
  | contrastText
  | dark
  | light

export type ColorRecordType = Record<
  ColorIndex,
  ({
    opacityValue,
    opacityVariable,
  }: {
    opacityValue: string
    opacityVariable: string
  }) => string,
  string
>

export type Colors = DefaultColors & {
  action: {
    active: ColorRecordType
    disabled: ColorRecordType
    disabledBackground: ColorRecordType
    highlight: ColorRecordType
    hover: ColorRecordType
    selected: ColorRecordType
  }
  background: ColorRecordType & {
    paper: ColorRecordType
  }
  divider: ColorRecordType
  error: ColorRecordType
  info: ColorRecordType
  primary: ColorRecordType
  secondary: ColorRecordType
  success: ColorRecordType
  typography: ColorRecordType & {
    disabled: ColorRecordType
    primary: ColorRecordType
    secondary: ColorRecordType
  }
  warning: ColorRecordType
}

export interface ThemeConfig extends DefaultTheme {
  colors: Colors
  originalColors: Colors
}
