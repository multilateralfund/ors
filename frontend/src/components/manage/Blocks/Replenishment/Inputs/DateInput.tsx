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

  const openPicker = () => {
    const input = realInput.current

    if (input?.showPicker) {
      input.showPicker()
    }
  }

  return (
    <div className="relative flex flex-grow">
      <input
        id={id}
        name={name || id}
        className={cx(CLASSESS, className, {
          [CSS_MASKED]: !inputMode && !formatValue,
          'pointer-events-auto absolute bottom-0 left-0 h-1 w-1 pb-[30px] opacity-0':
            formatValue,
        })}
        ref={realInput}
        style={STYLE}
        type="date"
        value={value}
        tabIndex={0}
        onFocus={() => setInputMode(true)}
        onPointerDown={() => openPicker()}
        onBlur={() => setInputMode(false)}
        onChange={onChange}
        {...rest}
      />
      <input
        id={`${id}_mask`}
        className={cx(CLASSESS, className, {
          [CSS_MASKED]: inputMode && !formatValue,
          'z-10': formatValue,
        })}
        ref={maskInput}
        style={STYLE}
        tabIndex={-1}
        type="text"
        value={maskDate}
        onChange={() => false}
        onPointerDown={(e) => {
          e.preventDefault()
          openPicker()
        }}
        onFocus={() => setInputMode(true)}
        {...rest}
      />
    </div>
  )
}
