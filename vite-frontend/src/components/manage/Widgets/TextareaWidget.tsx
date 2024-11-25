/* eslint-disable react/display-name */
import type { InputLabelProps, TextareaAutosizeProps } from '@mui/material'

import { forwardRef } from 'react'

import { InputLabel as MuiInputLabel, TextareaAutosize } from '@mui/material'
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
export type TextareaWidgetProps = {
  InputLabel?: { label?: React.ReactNode } & InputLabelProps
} & TextareaAutosizeProps

const TextareaWidget = forwardRef(
  (
    { InputLabel, className, ...rest }: TextareaWidgetProps,
    ref: any,
  ): JSX.Element => {
    return (
      <>
        <Label {...(InputLabel || {})} id={rest.id} />
        <TextareaAutosize
          className={cx('block w-full max-w-full rounded p-2', className)}
          minRows={5}
          ref={ref}
          {...rest}
        />
      </>
    )
  },
)

export default TextareaWidget
