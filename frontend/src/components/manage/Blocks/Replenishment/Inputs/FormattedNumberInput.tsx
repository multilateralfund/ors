import React, { useEffect, useRef, useState } from 'react'

import cx from 'classnames'

import { formatDecimalValue, getFloat } from '@ors/helpers/Utils/Utils'

import { CLASSESS, CSS_MASKED, STYLE } from './constants'
import { IFormattedNumberInputProps } from './types'
import { refocusMaskedInput } from './utils'

export default function FormattedNumberInput(
  props: IFormattedNumberInputProps,
) {
  const {
    id,
    className,
    decimalDigits = 2,
    name,
    onChange,
    onlyNumber,
    value,
    ...rest
  } = props

  const [inputMode, setInputMode] = useState(false)

  const realInput = useRef<HTMLInputElement>(null)
  const maskInput = useRef<HTMLInputElement>(null)

  useEffect(
    function () {
      if (realInput.current && inputMode) {
        realInput.current.focus()
      }
    },
    [realInput, inputMode],
  )

  useEffect(function () {
    if (realInput.current && maskInput.current) {
      return refocusMaskedInput(realInput.current, maskInput.current)
    }
  }, [])

  return (
    <div className="relative">
      <input
        id={id}
        name={name || id}
        className={cx(CLASSESS, className, {
          [CSS_MASKED]: !inputMode && !onlyNumber,
        })}
        ref={realInput}
        style={STYLE}
        type="number"
        value={value}
        onBlur={() => setInputMode(false)}
        onChange={onChange}
        {...rest}
      />
      <input
        id={`${id}_mask`}
        className={cx(CLASSESS, className, {
          [CSS_MASKED]: inputMode || onlyNumber,
        })}
        readOnly={true}
        ref={maskInput}
        style={STYLE}
        type="text"
        value={formatDecimalValue(getFloat(value), {
          maximumFractionDigits: decimalDigits,
          minimumFractionDigits: decimalDigits,
        })}
        onChange={() => false}
        onFocus={() => setInputMode(true)}
        {...rest}
      />
    </div>
  )
}