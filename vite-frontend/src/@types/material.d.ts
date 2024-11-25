import type { AutocompleteProps as MuiAutocompleteProps } from '@mui/material'

declare module '@mui/material' {
  interface AutocompleteProps extends MuiAutocompleteProps {
    options?: Array<any> | undefined
    renderInput?: (params: AutocompleteRenderInputParams) => React.ReactNode
  }
  interface BreakpointOverrides {
    '2xl': true
    lg: true
    md: true
    sm: true
    xl: true
    xs: true
  }
}
