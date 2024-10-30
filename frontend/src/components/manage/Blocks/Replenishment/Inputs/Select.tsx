import React, { useEffect, useRef, useState } from 'react'

import cx from 'classnames'

import ClearButton from './ClearButton'
import { CLASSESS, CSS_MASKED, STYLE } from './constants'
import { ISingleSelectProps } from './types'

export default function Select(props: ISingleSelectProps) {
  const {
    id,
    children,
    className,
    clearBtnClassName,
    defaultValue,
    hasClear,
    name,
    onChange,
    onClear,
    ...rest
  } = props
  const selectRef = useRef<HTMLSelectElement>(null)
  const [value, setValue] = useState(defaultValue || '')

  const handleClear = () => {
    if (selectRef.current) {
      selectRef.current.value = ''
    }
    setValue('')
    if (onClear) {
      onClear()
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setValue(event.target.value)
    if (onChange) {
      onChange(event)
    }
  }

  useEffect(() => {
    if (selectRef.current) {
      setValue(selectRef.current.value)
    }
  }, [])

  const withClear = hasClear && value

  return (
    <div className="relative flex flex-1">
      <select
        id={id}
        name={name || id}
        className={cx(CLASSESS, className)}
        ref={selectRef}
        style={STYLE}
        value={value}
        onChange={handleChange}
        {...rest}
      >
        {children}
      </select>
      {withClear && (
        <ClearButton
          className={cx('right-4', clearBtnClassName)}
          onClick={handleClear}
        />
      )}
    </div>
  )
}
