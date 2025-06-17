import type { TextWidgetProps } from './TextWidget'
import type { AutocompleteProps } from '@mui/material'

import { forwardRef } from 'react'

import { Autocomplete } from '@mui/material'
import cx from 'classnames'
import { isObject, isString } from 'lodash'

import TextWidget from './TextWidget'

type DefaultValue = {
  [key: string]: any
  id: number | string
  label?: string
}

export interface AutocompleteWidgetProps<T = DefaultValue | undefined>
  extends AutocompleteProps<
    T,
    boolean | undefined,
    boolean | undefined,
    boolean | undefined
  > {
  Input?: TextWidgetProps
  getCount?: (option: T) => number
  options?: T[] | undefined
  withDisabledOptions?: boolean
  optionClassname?: string
  optionTextClassname?: string
}

const AutocompleteWidget = forwardRef(function AutocompleteWidget(
  {
    Input,
    className,
    getCount,
    getOptionLabel,
    isOptionEqualToValue,
    options,
    renderInput,
    renderOption,
    withDisabledOptions,
    optionClassname,
    optionTextClassname,
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
        const count = !!getCount ? getCount(option) : null
        // if (!!getCount && !count) {
        //   return <Fragment key={option.id} />
        // }
        const className = props.className

        return (
          // @ts-ignore
          <li
            {...props}
            key={option.id || option.value || option.label || option}
            className={cx(className, optionClassname, {
              'pointer-events-none opacity-40':
                withDisabledOptions && option.disabled,
            })}
          >
            <div
              className={cx(
                'flex w-full items-start justify-between gap-x-4',
                optionTextClassname,
              )}
            >
              <span>
                {!!getOptionLabel ? getOptionLabel(option) : option.label}
              </span>
              {!!getCount && <span>({count})</span>}
            </div>
          </li>
        )
      }}
      {...rest}
    />
  )
})

export default AutocompleteWidget
