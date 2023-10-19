import type { TextWidgetProps } from './TextWidget'
import type { AutocompleteProps } from '@mui/material'

import { forwardRef } from 'react'

import { Autocomplete } from '@mui/material'
import cx from 'classnames'
import { isObject, isString } from 'lodash'

import TextWidget from './TextWidget'

export interface AutocompleteWidgetProps
  extends AutocompleteProps<
    { [key: string]: any; id: number; label?: string } | undefined,
    boolean | undefined,
    boolean | undefined,
    boolean | undefined
  > {
  Input?: TextWidgetProps
  options?:
    | Array<{ [key: string]: any; id: number; label?: string } | undefined>
    | undefined
}

const AutocompleteWidget = forwardRef(function AutocompleteWidget(
  {
    Input,
    className,
    getOptionLabel,
    isOptionEqualToValue,
    options,
    renderInput,
    renderOption,
    ...rest
  }: AutocompleteWidgetProps,
  ref: any,
): JSX.Element {
  return (
    <Autocomplete
      className={cx('w-full', className)}
      options={options || []}
      ref={ref}
      getOptionLabel={(option) => {
        if (!option) return ''
        if (!!getOptionLabel) {
          return getOptionLabel(option)
        }
        if (isString(option)) return option
        return option.label || ''
      }}
      isOptionEqualToValue={(option, value) => {
        if (isOptionEqualToValue) {
          return isOptionEqualToValue(option, value)
        }
        if (isObject(option) && isObject(value) && option.label) {
          return option.label === value.label
        }
        if (isObject(option) && isString(value) && option.label) {
          return option.label === value
        }
        return option === value
      }}
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
            {getOptionLabel?.(option) ?? option.label}
          </li>
        )
      }}
      {...rest}
    />
  )
})

export default AutocompleteWidget
