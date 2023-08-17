/* eslint-disable react/display-name */
import type { TextWidgetProps } from './TextWidget'
import type { AutocompleteProps } from '@mui/material'

import { forwardRef } from 'react'

import { Autocomplete } from '@mui/material'
import cx from 'classnames'

import TextWidget from './TextWidget'

export interface AutocompleteWidgetProps
  extends AutocompleteProps<
    { [key: string]: any; id: number; label?: string } | undefined,
    boolean | undefined,
    boolean | undefined,
    boolean | undefined
  > {
  Input?: TextWidgetProps
  options?: Array<any> | undefined
}

export type AutocompleteWidget = (props: AutocompleteWidgetProps) => JSX.Element

const AutocompleteWidget = forwardRef(
  (
    {
      Input,
      className,
      options,
      renderInput,
      renderOption,
      ...rest
    }: AutocompleteWidgetProps,
    ref: any,
  ): JSX.Element => {
    return (
      <Autocomplete
        className={cx('w-full', className)}
        options={options || []}
        ref={ref}
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
            <li {...props} key={option?.id}>
              {rest.getOptionLabel?.(option) ?? option.label}
            </li>
          )
        }}
        {...rest}
      />
    )
  },
)

export default AutocompleteWidget
