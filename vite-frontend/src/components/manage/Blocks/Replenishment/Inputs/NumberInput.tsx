import { ChangeEventHandler, forwardRef } from 'react'

import cx from 'classnames'

import { getFloat } from '@ors/helpers'

import { CLASSESS, STYLE } from './constants'
import { INumberInputProps } from './types'

const NumberInput = forwardRef<HTMLInputElement, INumberInputProps>(
  function NumberInput(props, ref) {
    const { id, className, name, onChange, ...rest } = props

    const handleChange: ChangeEventHandler<HTMLInputElement> = (evt) => {
      const value = evt.target.value
      if (!value || (!!value && getFloat(value)) || value === '-') {
        onChange!(evt)
      }
    }

    return (
      <input
        id={id}
        name={name || id}
        className={cx(CLASSESS, className)}
        inputMode="numeric"
        ref={ref}
        style={STYLE}
        type="text"
        onChange={onChange ? handleChange : undefined}
        {...rest}
      />
    )
  },
)

export default NumberInput
