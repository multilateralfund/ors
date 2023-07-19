import {
  Palette as MuiPallete,
  PaletteColorOptions,
  PaletteOptions as MuiPaletteOptions,
} from '@mui/material/styles/createPalette'

declare module '@mui/material/styles/createPalette' {
  interface Palette extends MuiPallete {
    base: PaletteColorOptions
  }

  interface PaletteOptions extends MuiPaletteOptions {
    base?: PaletteColorOptions
  }
}
