import React, { useEffect, useMemo, useRef, useState } from 'react'

import cx from 'classnames'

import { CLASSESS, CSS_MASKED, STYLE } from './constants'
import { IDateInputProps } from './types'
import { refocusMaskedInput } from './utils'

export default function DateInput(props: IDateInputProps) {
  const { id, className, name, onChange, type, value, ...rest } = props

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
      let result = ''
      if (value) {
        const intl = new Intl.DateTimeFormat('en-US', { month: 'short' })
        const date = new Date(Date.parse(value))
        result = `${date.getDate()} ${intl.format(date)} ${date.getFullYear()}`
      }
      return result
    },
    [value],
  )

  return (
    <>
      <input
        id={id}
        name={name || id}
        className={cx(CLASSESS, className, { [CSS_MASKED]: !inputMode })}
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
        className={cx(CLASSESS, className, { [CSS_MASKED]: inputMode })}
        ref={maskInput}
        style={STYLE}
        type="text"
        value={maskDate}
        onChange={() => false}
        onFocus={() => setInputMode(true)}
        {...rest}
      />
    </>
  )
}
