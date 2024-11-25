import type { InputLabelProps, TextFieldProps } from '@mui/material'

import { forwardRef } from 'react'

import { InputLabel as MuiInputLabel, TextField } from '@mui/material'
import cx from 'classnames'

function Label({
  id,
  className,
  label,
  ...rest
}: { label?: React.ReactNode } & InputLabelProps) {
  return (
    !!label && (
      <MuiInputLabel className={cx('mb-2', className)} htmlFor={id} {...rest}>
        {label}
      </MuiInputLabel>
    )
  )
}
export type TextWidgetProps = {
  InputLabel?: { label?: React.ReactNode } & InputLabelProps
} & TextFieldProps

const TextWidget = forwardRef(function TextWidget(
  { InputLabel, className, ...rest }: TextWidgetProps,
  ref: any,
): JSX.Element {
  return (
    <>
      <Label
        {...(InputLabel || {})}
        id={rest.id}
        error={rest?.error || false}
      />
      <TextField
        className={cx('w-full', className)}
        ref={ref}
        size="small"
        variant="outlined"
        {...rest}
      />
    </>
  )
})

export default TextWidget
