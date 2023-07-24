import type { AutocompleteProps as MuiAutocompleteProps } from '@mui/material'

declare module '@mui/material' {
  interface AutocompleteProps extends MuiAutocompleteProps {
    options?: Array<any> | undefined
    renderInput?: (params: AutocompleteRenderInputParams) => React.ReactNode
  }
}
