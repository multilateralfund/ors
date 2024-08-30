import React, { forwardRef, useEffect, useMemo, useRef, useState } from 'react'

import cx from 'classnames'

import { BaseButton } from '@ors/components/ui/Button/Button'
import { formatDecimalValue } from '@ors/helpers/Utils/Utils'
import useClickOutside from '@ors/hooks/useClickOutside'

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
  if (props.multiple) {
    return <MultiSelect {...props} />
  } else {
    return <SingleSelect {...props} />
  }
}

export function SingleSelect(props) {
  const {
    id,
    children,
    className,
    defaultValue,
    hasClear,
    name,
    onChange,
    ...rest
  } = props
  const selectRef = useRef(null)
  const [value, setValue] = useState(defaultValue || '')

  const handleClear = () => {
    if (selectRef.current) {
      selectRef.current.value = ''
    }
    setValue('')
    if (onChange) {
      onChange({ target: { name: name || id, value: '' } })
    }
  }

  function handleChange(event) {
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
        value={value}
        onChange={handleChange}
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

export function MultiSelect(props) {
  const {
    id,
    children,
    className,
    defaultValue,
    hasClear,
    name,
    onChange,
    required,
    ...rest
  } = props
  const selectRef = useRef(null)
  const inputRef = useRef(null)

  const [value, setValue] = useState(defaultValue || [])
  const [options, setOptions] = useState([])

  const [showPicker, setShowPicker] = useState(false)

  const ref = useClickOutside(function () {
    if (showPicker) {
      setShowPicker(false)
    }
  })

  function handleClear() {
    if (selectRef.current) {
      selectRef.current.value = ''
    }
    setValue([])
    if (onChange) {
      onChange(undefined, [])
    }
  }

  function getSelectedOptionsValue(el) {
    const result = []

    for (let i = 0; i < el.selectedOptions.length; i++) {
      result.push(el.selectedOptions[i].value)
    }

    return result
  }

  function getOptions(el) {
    const result = []

    for (let i = 0; i < el.options.length; i++) {
      result.push({
        label: el.options[i].textContent || '',
        value: el.options[i].value,
      })
    }

    return result
  }

  function handleChange(evt) {
    const newValue = getSelectedOptionsValue(evt.target)
    setValue(newValue)
    if (onChange) {
      onChange(evt, newValue)
    }
  }

  function handleToggleSelectedOption(evt) {
    const value = evt.target.value
    setValue(function (prev) {
      let newValue = []
      if (prev.includes(value)) {
        for (let i = 0; i < prev.length; i++) {
          if (prev[i] !== value) {
            newValue.push(prev[i])
          }
        }
      } else {
        newValue = [...prev, value]
      }
      return newValue
    })
  }

  function handleInputFocus(evt) {
    setShowPicker(true)
  }

  function handleDone(evt) {
    setShowPicker(false)
    if (inputRef.current) {
      inputRef.current.blur()
    }
  }

  useEffect(() => {
    if (selectRef.current) {
      setOptions(getOptions(selectRef.current))
    }
  }, [])

  const withClear = hasClear && value.length > 0

  const virtualOptions = useMemo(
    function () {
      const result = []

      for (let i = 0; i < options.length; i++) {
        const optionId = `${id}_${options[i].value}`
        result.push(
          <div key={optionId} className="flex items-center hover:bg-gray-200">
            <input
              id={optionId}
              checked={value.includes(options[i].value)}
              type="checkbox"
              value={options[i].value}
              onChange={handleToggleSelectedOption}
            ></input>
            <label className="flex-grow py-2" htmlFor={optionId}>
              {options[i].label}
            </label>
          </div>,
        )
      }

      return result
    },
    [id, value, options],
  )

  return (
    <div className="relative" ref={ref}>
      <div className="relative flex flex-1">
        <Input
          placeholder={'Please select...'}
          ref={inputRef}
          required={required}
          type="text"
          value={value.length ? `${value.length} selected` : ''}
          onChange={() => {
            return
          }}
          onFocus={handleInputFocus}
        ></Input>
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
      <div
        className={cx(
          'absolute left-2 z-10 mt-1 w-full origin-top rounded-md border border-solid border-primary bg-white p-2 opacity-0 shadow-xl transition-all',
          className,
          {
            'collapse scale-y-0': !showPicker,
            'scale-y-100 opacity-100': showPicker,
          },
        )}
      >
        <div className="max-h-64 overflow-y-auto">{virtualOptions}</div>
        <div className="mt-2 flex items-center justify-center">
          <BaseButton className="!py-1 text-sm" onClick={handleDone}>
            Done
          </BaseButton>
        </div>
      </div>
      <select
        id={id}
        name={name || id}
        className={'invisible hidden'}
        ref={selectRef}
        value={value}
        onChange={handleChange}
        {...rest}
      >
        {children}
      </select>
    </div>
  )
}

export const Input = forwardRef(function Input(props, ref) {
  const { id, className, name, type, ...rest } = props
  const elementType = type === 'text-area' ? 'textarea' : 'input'

  return React.createElement(elementType, {
    id,
    className: cx(CLASSESS, className),
    name: name || id,
    ref: ref,
    type: type !== 'text-area' ? type : undefined,
    ...rest,
  })
})

export function FormattedNumberInput(props) {
  const { id, className, name, onChange, onlyNumber, type, value, ...rest } =
    props

  const [inputMode, setInputMode] = useState(false)

  const realInput = useRef(null)

  useEffect(
    function () {
      if (realInput.current && inputMode) {
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
        className={cx(CLASSESS, className, {
          hidden: !inputMode && !onlyNumber,
        })}
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
        className={cx(CLASSESS, className, { hidden: inputMode || onlyNumber })}
        readOnly={true}
        type="text"
        value={formatDecimalValue(value || 0, {})}
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
      if (realInput.current && inputMode) {
        realInput.current.focus()
        realInput.current.showPicker()
      }
    },
    [realInput, inputMode],
  )

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
