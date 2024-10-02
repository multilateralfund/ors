import React, { useEffect, useMemo, useRef, useState } from 'react'

import cx from 'classnames'

import { BaseButton } from '@ors/components/ui/Button/Button'
import useClickOutside from '@ors/hooks/useClickOutside'

import ClearButton from './ClearButton'
import Input from './Input'
import { IMultiSelectProps } from './types'

export default function MultiSelect(props: IMultiSelectProps) {
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
  const selectRef = useRef<HTMLSelectElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [value, setValue] = useState(defaultValue || [])
  const [options, setOptions] = useState<{ label: string; value: string }[]>([])

  const [showPicker, setShowPicker] = useState(false)

  const ref = useClickOutside<HTMLDivElement>(function () {
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
      onChange([])
    }
  }

  function getSelectedOptionsValue(el: HTMLSelectElement) {
    const result = []

    for (let i = 0; i < el.selectedOptions.length; i++) {
      result.push(el.selectedOptions[i].value)
    }

    return result
  }

  function getOptions(el: HTMLSelectElement) {
    const result = []

    for (let i = 0; i < el.options.length; i++) {
      result.push({
        label: el.options[i].textContent || '',
        value: el.options[i].value,
      })
    }

    return result
  }

  function handleChange(evt: React.ChangeEvent<HTMLSelectElement>) {
    const newValue = getSelectedOptionsValue(evt.target)
    setValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  function handleToggleSelectedOption(
    evt: React.ChangeEvent<HTMLInputElement>,
  ) {
    const evtValue = evt.target.value
    let newValue = []
    if (value.includes(evtValue)) {
      for (let i = 0; i < value.length; i++) {
        if (value[i] !== evtValue) {
          newValue.push(value[i])
        }
      }
    } else {
      newValue = [...value, evtValue]
    }
    setValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  function handleInputFocus() {
    setShowPicker(true)
  }

  function handleDone() {
    setShowPicker(false)
    if (inputRef.current) {
      inputRef.current.blur()
    }
  }

  useEffect(() => {
    if (selectRef.current) {
      setOptions(getOptions(selectRef.current))
    }
  }, [children])

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
        {withClear && <ClearButton className="right-4" onClick={handleClear} />}
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
        multiple={true}
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
