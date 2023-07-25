import type { TextWidgetProps } from './TextWidget'
import type { AutocompleteProps } from '@mui/material'

import { Autocomplete } from '@mui/material'

import TextWidget from './TextWidget'

export interface AutocompleteWidgetProps
  extends AutocompleteProps<
    { [key: string]: any; id: number; label?: string } | undefined,
    boolean | undefined,
    boolean | undefined,
    boolean | undefined
  > {
  Input?: TextWidgetProps
  options?: Array<
    { [key: string]: any; id: number; label?: string } | undefined
  >
}

export type AutocompleteWidget = (props: AutocompleteWidgetProps) => JSX.Element

export default function AutocompleteWidget({
  Input,
  options,
  renderInput,
  renderOption,
  ...rest
}: AutocompleteWidgetProps): JSX.Element {
  return (
    <Autocomplete
      options={options || []}
      renderInput={
        !!renderInput
          ? renderInput
          : (params) => (
              <TextWidget {...params} size="small" {...(Input || {})} />
            )
      }
      renderOption={(props, option, ...args) => {
        if (!option) return null
        if (!!renderOption) {
          return renderOption(props, option, ...args)
        }
        return (
          <li {...props} key={option.id}>
            {option.label}
          </li>
        )
      }}
      {...rest}
    />
  )
}
