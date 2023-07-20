import cx from 'classnames'

import MUIInputLabel, { InputLabelProps } from '@mui/material/InputLabel'
import TextField, { TextFieldProps } from '@mui/material/TextField'

function Label({
  label,
  className,
  id,
  ...rest
}: InputLabelProps & { label?: React.ReactNode }) {
  return (
    !!label && (
      <MUIInputLabel htmlFor={id} className={cx('mb-2', className)} {...rest}>
        {label}
      </MUIInputLabel>
    )
  )
}

export type TextWidgetProps = TextFieldProps & {
  InputLabel?: InputLabelProps & { label?: React.ReactNode }
}

export default function TextWidget({
  InputLabel,
  className,
  ...rest
}: TextWidgetProps) {
  return (
    <div className="widget text-widget">
      <Label {...InputLabel} id={rest.id} />
      <TextField
        variant="outlined"
        size="small"
        className={cx('w-full', className)}
        {...rest}
      />
    </div>
  )
}
