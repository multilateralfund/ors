import type {
  PaletteOptions as MUIPaletteOptions,
  Palette as MUIPallete,
  PaletteColorOptions,
} from '@mui/material/styles/createPalette'

declare module '@mui/material/styles/createPalette' {
  interface Palette extends MuiPallete {
    base: PaletteColorOptions
  }

  interface PaletteOptions extends MuiPaletteOptions {
    base?: PaletteColorOptions
  }
}
