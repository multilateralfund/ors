import type {
  PaletteOptions as MuiPaletteOptions,
  Palette as MuiPallete,
  PaletteColorOptions,
} from '@mui/material/styles/createPalette'

declare module '@mui/material/styles/createPalette' {
  interface Palette extends MuiPallete {}

  interface PaletteOptions extends MuiPaletteOptions {}
}
