import type { InputLabelProps, TextFieldProps } from '@mui/material'

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

export type TextWidget = (props: TextWidgetProps) => JSX.Element

export default function TextWidget({
  InputLabel,
  className,
  ...rest
}: TextWidgetProps): JSX.Element {
  return (
    <>
      <Label {...(InputLabel || {})} id={rest.id} />
      <TextField
        className={cx('w-full', className)}
        size="small"
        variant="outlined"
        {...rest}
      />
    </>
  )
}
