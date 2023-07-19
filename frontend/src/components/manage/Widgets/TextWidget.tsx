import cx from 'classnames'

import TextField, { TextFieldProps } from '@mui/material/TextField'

export default function TextWidget({
  label,
  className,
  ...rest
}: TextFieldProps) {
  return (
    <div className="widget text-widget">
      {!!label && (
        <p className="label mb-2">
          <label htmlFor={rest.name}>{label}</label>
        </p>
      )}
      <TextField
        variant="outlined"
        size="small"
        className={cx('w-full', className)}
        {...rest}
      />
    </div>
  )
}
