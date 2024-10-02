import React, { forwardRef } from 'react'

import cx from 'classnames'

import { CLASSESS, CSS_MASKED, STYLE } from './constants'

const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input(props, ref) {
  const { id, className, name, type, ...rest } = props
  const elementType = type === 'text-area' ? 'textarea' : 'input'

  return React.createElement(elementType, {
    id,
    className: cx(CLASSESS, className),
    name: name || id,
    ref: ref,
    style: STYLE,
    type: type !== 'text-area' ? type : undefined,
    ...rest,
  })
})

export default Input
