/* eslint-disable react/display-name */
import type { InputLabelProps, TextFieldProps } from '@mui/material'

import { forwardRef } from 'react'

import { InputLabel as MuiInputLabel, TextField } from '@mui/material'
import cx from 'classnames'

function Label({
  id,
  className,
  label,
  ...rest
}: InputLabelProps & { label?: React.ReactNode }) {
  return (
    !!label && (
      <MuiInputLabel className={cx('mb-2', className)} htmlFor={id} {...rest}>
        {label}
      </MuiInputLabel>
    )
  )
}
export type TextWidgetProps = TextFieldProps & {
  InputLabel?: InputLabelProps & { label?: React.ReactNode }
}

const TextWidget = forwardRef(
  (
    { InputLabel, className, ...rest }: TextWidgetProps,
    ref: any,
  ): JSX.Element => {
    return (
      <>
        <Label {...(InputLabel || {})} id={rest.id} />
        <TextField
          className={cx('w-full', className)}
          ref={ref}
          size="small"
          variant="outlined"
          {...rest}
        />
      </>
    )
  },
)

export default TextWidget
