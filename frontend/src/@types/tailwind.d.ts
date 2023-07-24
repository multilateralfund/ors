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

export type ColorRecordType = Record<ColorIndex, string>

export interface ThemeConfig extends DefaultTheme {
  colors: DefaultColors & {
    common: {
      black: string
      white: string
    }
    error: ColorRecordType
    info: ColorRecordType
    primary: ColorRecordType
    secondary: ColorRecordType
    success: ColorRecordType
    warning: ColorRecordType
  }
}
