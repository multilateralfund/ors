import { useEffect, useMemo, useRef, useState } from 'react'

import cx from 'classnames'

import { formatIso8601DateString } from '@ors/components/manage/Blocks/Replenishment/utils'

import { CLASSESS, CSS_MASKED, STYLE } from './constants'
import { IDateInputProps } from './types'
import { refocusMaskedInput } from './utils'

export default function DateInput(props: IDateInputProps) {
  const { id, className, name, onChange, type, value, formatValue, ...rest } =
    props

  const [inputMode, setInputMode] = useState(false)

  const realInput = useRef<HTMLInputElement>(null)
  const maskInput = useRef<HTMLInputElement>(null)

  useEffect(
    function () {
      if (realInput.current && inputMode) {
        realInput.current.focus()
        realInput.current.showPicker()
      }
    },
    [realInput, inputMode],
  )

  useEffect(function () {
    if (realInput.current && maskInput.current) {
      return refocusMaskedInput(realInput.current, maskInput.current)
    }
  }, [])

  const maskDate = useMemo(
    function () {
      return value
        ? formatValue
          ? formatValue(value)
          : formatIso8601DateString(value)
        : ''
    },
    [value],
  )

  return (
    <div className="relative flex flex-grow">
      <input
        id={id}
        name={name || id}
        className={cx(CLASSESS, className, {
          [CSS_MASKED]: !inputMode && !formatValue,
          'pointer-events-auto absolute bottom-0 left-0 h-10 w-10 opacity-0':
            formatValue,
        })}
        ref={realInput}
        style={STYLE}
        type="date"
        value={value}
        onBlur={() => setInputMode(false)}
        onChange={onChange}
        {...rest}
      />
      <input
        id={`${id}_mask`}
        className={cx(CLASSESS, className, {
          [CSS_MASKED]: inputMode && !formatValue,
        })}
        ref={maskInput}
        style={STYLE}
        type="text"
        value={maskDate}
        onChange={() => false}
        onFocus={() => setInputMode(true)}
        {...rest}
      />
    </div>
  )
}
