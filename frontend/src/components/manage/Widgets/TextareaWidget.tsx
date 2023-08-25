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
}: InputLabelProps & { label?: React.ReactNode }) {
  return (
    !!label && (
      <MuiInputLabel className={cx('mb-2', className)} htmlFor={id} {...rest}>
        {label}
      </MuiInputLabel>
    )
  )
}
export type TextareaWidgetProps = TextareaAutosizeProps & {
  InputLabel?: InputLabelProps & { label?: React.ReactNode }
}

export type TextareaWidget = (props: TextareaWidgetProps) => JSX.Element

const TextareaWidget = forwardRef(
  (
    { InputLabel, className, ...rest }: TextareaWidgetProps,
    ref: any,
  ): JSX.Element => {
    return (
      <>
        <Label {...(InputLabel || {})} id={rest.id} />
        <TextareaAutosize
          className={cx('w-full p-2', className)}
          minRows={5}
          ref={ref}
          {...rest}
        />
      </>
    )
  },
)

export default TextareaWidget
