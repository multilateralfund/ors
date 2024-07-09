import { useEffect, useRef, useState } from 'react'

import cx from 'classnames'

import { formatDecimalValue } from '@ors/helpers/Utils/Utils'

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
  const { id, children, className, name, ...rest } = props
  return (
    <select
      id={id}
      name={name || id}
      className={cx(CLASSESS, className)}
      {...rest}
    >
      {children}
    </select>
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
