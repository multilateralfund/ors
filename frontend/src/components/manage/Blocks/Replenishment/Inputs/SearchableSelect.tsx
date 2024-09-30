import type { ISearchableSelectProps } from './types'

import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import cx from 'classnames'

import { BaseButton } from '@ors/components/ui/Button/Button'
import useClickOutside from '@ors/hooks/useClickOutside'

import ClearButton from './ClearButton'
import Input from './Input'
import { CLASSESS, CSS_MASKED, STYLE } from './constants'

export interface IOption {
  label: string
  value: string
}

export default function SearchableSelect(props: ISearchableSelectProps) {
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

  const [value, setValue] = useState(defaultValue)
  const [options, setOptions] = useState<IOption[]>([])
  const [searchValue, setSearchValue] = useState<string>('')

  const [showPicker, setShowPicker] = useState(false)

  const ref = useClickOutside<HTMLDivElement>(function () {
    if (showPicker) {
      setShowPicker(false)
    }
    setValue(selectedOption?.value || '')
    setSearchValue(selectedOption?.label || '')
  })

  const selectedOption = useMemo(
    function () {
      let result: IOption | null = null

      for (let i = 0; i < options.length; i++) {
        if (options[i].value === value) {
          result = options[i]
        }
      }

      return result
    },
    [options, value],
  )

  function handleClear() {
    if (selectRef.current) {
      selectRef.current.value = ''
    }
    setValue('')
    if (onChange) {
      onChange('')
    }
  }

  const filteredOptions = useMemo(
    function () {
      let result = []

      if (searchValue) {
        for (let i = 0; i < options.length; i++) {
          if (options[i].label.toLowerCase().indexOf(searchValue) !== -1) {
            result.push(options[i])
          }
        }
      } else {
        result = [...options]
      }

      return result
    },
    [options, searchValue],
  )

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

  function handleChange(evt: ChangeEvent<HTMLSelectElement>) {
    const newValue = evt.target.value
    setValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  const handleToggleSelectedOption = useCallback(
    function (value: string, label: string) {
      return function () {
        setValue(function (prev) {
          if (value !== prev) {
            return value
          } else {
            return ''
          }
        })
        setSearchValue(label)
        setShowPicker(false)
        if (onChange) {
          onChange(value)
        }
      }
    },
    [onChange],
  )

  function handleInputFocus() {
    setSearchValue('')
    setShowPicker(true)
  }

  useEffect(() => {
    if (selectRef.current) {
      setOptions(getOptions(selectRef.current))
    }
  }, [children])

  const withClear = hasClear && value

  const virtualOptions = useMemo(
    function () {
      const result = []

      for (let i = 0; i < filteredOptions.length; i++) {
        const optionId = `${id}_${filteredOptions[i].value}`
        result.push(
          <div
            key={optionId}
            className={cx('flex cursor-pointer items-center rounded-lg', {
              'bg-primary text-mlfs-hlYellow':
                value === filteredOptions[i].value,
              'hover:bg-gray-200': value !== filteredOptions[i].value,
            })}
            onClick={handleToggleSelectedOption(
              filteredOptions[i].value,
              filteredOptions[i].label,
            )}
          >
            <span className="px-2 py-2">{filteredOptions[i].label}</span>
          </div>,
        )
      }

      return result
    },
    [id, value, filteredOptions, handleToggleSelectedOption],
  )

  return (
    <div className="relative" ref={ref}>
      <div className="relative flex flex-1">
        <Input
          placeholder={'Type to search...'}
          ref={inputRef}
          required={required}
          type="text"
          value={searchValue}
          onChange={(evt) => setSearchValue(evt.target.value.toLowerCase())}
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
