import React, { useEffect, useMemo, useRef, useState } from 'react'

import cx from 'classnames'

import { formatDecimalValue } from '@ors/helpers/Utils/Utils'

import { IoClose } from 'react-icons/io5'

const CLASSESS =
  'ml-4 rounded-lg border border-solid border-primary bg-white px-4 py-2 grow disabled:bg-gray-200 disabled:border-0'

export function Field(props) {
  const { id, children, label } = props

  return (
    <div className="my-2 flex items-center">
      <label className="inline-block w-48" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}

export function Select(props) {
  const { id, children, className, hasClear, name, ...rest } = props
  const selectRef = useRef(null)

  const handleClear = () => {
    if (selectRef.current) {
      selectRef.current.value = ''
    }
    if (props.onChange) {
      props.onChange({ target: { name: name || id, value: '' } })
    }
  }

  const withClear = hasClear && selectRef.current.value

  return (
    <div className="relative">
      <select
        id={id}
        name={name || id}
        className={cx(CLASSESS, className)}
        ref={selectRef}
        {...rest}
      >
        {children}
      </select>
      {withClear && (
        <button
          className="absolute right-4 top-0 h-full border-0 bg-transparent px-2 text-gray-500 hover:cursor-pointer hover:text-secondary"
          aria-label="Clear selection"
          type="button"
          onClick={handleClear}
        >
          <IoClose size={16} />
        </button>
      )}
    </div>
  )
}

export function Input(props) {
  const { id, className, name, type, ...rest } = props
  return (
    <input
      id={id}
      name={name || id}
      className={cx(CLASSESS, className)}
      type={type}
      {...rest}
    />
  )
}

export function FormattedNumberInput(props) {
  const { id, className, name, onChange, type, value, ...rest } = props

  const [inputMode, setInputMode] = useState(false)

  const realInput = useRef(null)

  useEffect(
    function () {
      if (inputMode) {
        realInput.current.focus()
      }
    },
    [realInput, inputMode],
  )

  return (
    <>
      <input
        id={id}
        name={name || id}
        className={cx(CLASSESS, className, { hidden: !inputMode })}
        ref={realInput}
        type="number"
        value={value}
        onBlur={() => setInputMode(false)}
        onChange={onChange}
        {...rest}
      />
      <input
        id={`${id}_mask`}
        name={`${name || id}_mask`}
        className={cx(CLASSESS, className, { hidden: inputMode })}
        readOnly={true}
        type="text"
        value={formatDecimalValue(value ?? '', {})}
        onFocus={() => setInputMode(true)}
        {...rest}
      />
    </>
  )
}

export function DateInput(props) {
  const { id, className, name, onChange, type, value, ...rest } = props

  const [inputMode, setInputMode] = useState(false)

  const realInput = useRef(null)

  useEffect(
    function () {
      if (inputMode) {
        realInput.current.focus()
        realInput.current.showPicker()
      }
    },
    [realInput, inputMode],
  )

  const maskDate = useMemo(
    function () {
      const intl = new Intl.DateTimeFormat('en-US', { month: 'short' })
      const date = new Date(Date.parse(value))
      return `${date.getDate()} ${intl.format(date)} ${date.getFullYear()}`
    },
    [value],
  )

  return (
    <>
      <input
        id={id}
        name={name || id}
        className={cx(CLASSESS, className, { hidden: !inputMode })}
        ref={realInput}
        type="date"
        value={value}
        onBlur={() => setInputMode(false)}
        onChange={onChange}
        {...rest}
      />
      <input
        id={`${id}_mask`}
        name={`${name || id}_mask`}
        className={cx(CLASSESS, className, { hidden: inputMode })}
        readOnly={true}
        type="text"
        value={maskDate}
        onFocus={() => setInputMode(true)}
        {...rest}
      />
    </>
  )
}

export function FieldSelect(props) {
  const { id, children, label, ...rest } = props
  return (
    <Field id={id} label={label}>
      <Select id={id} {...rest}>
        {children}
      </Select>
    </Field>
  )
}

export function FieldInput(props) {
  const { id, children, label, ...rest } = props
  return (
    <Field id={id} label={label}>
      <Input id={id} {...rest} />
    </Field>
  )
}
