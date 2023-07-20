import Autocomplete from '@mui/material/Autocomplete'
import { AnyObject } from '@ors/@types/primitives'

import TextWidget, { TextWidgetProps } from './TextWidget'

export type AutocompleteWidgetProps = {
  Input?: TextWidgetProps
  options: Array<AnyObject>
}

export default function AutocompleteWidget({
  Input,
  options,
  ...rest
}: AutocompleteWidgetProps) {
  return (
    <Autocomplete
      options={options || []}
      renderInput={(params) => (
        <TextWidget {...params} size="small" {...Input} />
      )}
      {...rest}
    />
  )
}
