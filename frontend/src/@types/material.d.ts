import type { AutocompleteProps as MUIAutocompleteProps } from '@mui/material'

declare module '@mui/material' {
  interface AutocompleteProps extends MUIAutocompleteProps {
    options?: Array<any> | undefined
    renderInput?: (params: AutocompleteRenderInputParams) => React.ReactNode
  }
}
