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

import { debounce } from '@ors/helpers'
import useClickOutside from '@ors/hooks/useClickOutside'

import ClearButton from './ClearButton'
import Input from './Input'

function getSelectedOption(value: string, options: IOption[]) {
  let result: IOption | null = null

  for (let i = 0; i < options.length; i++) {
    if (options[i].value === value) {
      result = options[i]
    }
  }

  return result
}

export interface IOption {
  label: string
  value: string
}

interface VirtualOptionProps {
  className?: string
  id: string
  label: string
  onClick: (value: string, label: string) => void
  onKeyDown: React.KeyboardEventHandler<HTMLElement>
  selected: boolean
  value: string
}

function VirtualOption(props: VirtualOptionProps) {
  const { id, className, label, onClick, onKeyDown, selected, value } = props

  function handleClick() {
    onClick(value, label)
  }

  return (
    <div
      id={id}
      className={cx(
        'flex cursor-pointer items-center rounded-lg focus:outline-none',
        {
          'bg-primary text-mlfs-hlYellow': selected,
          'hover:bg-gray-200 focus:bg-gray-200': !selected,
        },
        className,
      )}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={onKeyDown}
    >
      <span className="px-2 py-2">{label}</span>
    </div>
  )
}

interface PickerProps {
  className?: string
  id?: string
  options: React.JSX.Element[]
  show: boolean
}

function Picker(props: PickerProps) {
  const { id, className, options, show } = props
  const wrapperId = `${id}_virtualOptions`
  return (
    <div
      className={cx(
        'absolute left-2 z-10 mt-1 w-full origin-top rounded-md border border-solid border-primary bg-white p-2 opacity-0 shadow-xl transition-all',
        className,
        {
          'collapse scale-y-0': !show,
          'scale-y-100 opacity-100': show,
        },
      )}
    >
      <div id={wrapperId} className="max-h-32 overflow-y-auto" tabIndex={-1}>
        {options.length > 0 ? (
          options
        ) : (
          <div className="flex justify-center">No options</div>
        )}
      </div>
    </div>
  )
}

export default function SearchableSelect(props: ISearchableSelectProps) {
  const {
    id,
    children,
    className,
    defaultValue,
    hasClear,
    hideFirstOption = false,
    name,
    onChange,
    pickerClassName,
    required,
    ...rest
  } = props
  const selectRef = useRef<HTMLSelectElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [value, setValue] = useState(defaultValue?.toString() || '')
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
      return getSelectedOption(value, options)
    },
    [options, value],
  )

  function handleClear() {
    if (selectRef.current) {
      selectRef.current.value = ''
    }
    setValue('')
    setSearchValue('')

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
    },
    [onChange],
  )

  function handleOptionKeyDown(evt: React.KeyboardEvent<HTMLElement>) {
    const evTarget = evt.target as HTMLElement
    if (evt.key === 'Enter') {
      evt.preventDefault()
      evt.currentTarget.click()
    } else if (evt.key === 'ArrowDown') {
      evt.preventDefault()
      const nextEl = evTarget?.nextElementSibling as HTMLElement | null
      nextEl?.focus()
    } else if (evt.key === 'ArrowUp') {
      evt.preventDefault()
      const prevEl = evTarget?.previousElementSibling as HTMLElement | null
      prevEl?.focus()
    }
  }

  function handleInputFocus() {
    setSearchValue('')
    setShowPicker(true)
    if (value && ref.current) {
      debounce(function () {
        const selEl = ref.current?.querySelector(`#${id}_${value}`)
        if (selEl) {
          selEl.scrollIntoView()
        }
      }, 100)
    }
  }

  function handleInputKeyDown(evt: React.KeyboardEvent<HTMLElement>) {
    if (evt.key === 'ArrowDown') {
      evt.preventDefault()
      const elOptions = ref.current?.querySelector(`#${id}_virtualOptions`)
      if (value) {
        const selectedOptionEl = elOptions?.querySelector(
          `#${id}_${value}`,
        ) as HTMLElement
        selectedOptionEl?.focus()
      } else {
        const firstOptionEl = elOptions?.querySelector(
          `[id*=${id}`,
        ) as HTMLElement
        firstOptionEl?.focus()
      }
    }
  }

  useEffect(() => {
    if (selectRef.current) {
      const options = getOptions(selectRef.current)
      setOptions(options)

      if (defaultValue && defaultValue.toString() === selectRef.current.value) {
        const selectedOption = getSelectedOption(
          defaultValue?.toString() || '',
          options,
        )
        if (selectedOption) {
          setSearchValue(selectedOption.label)
        }
      }
    }
  }, [defaultValue, children])

  const withClear = hasClear && value

  const virtualOptions = useMemo(
    function () {
      const result = []

      for (let i = 0; i < filteredOptions.length; i++) {
        if (!(hideFirstOption && i === 0)) {
          const optionId = `${id}_${filteredOptions[i].value}`
          result.push(
            <VirtualOption
              id={optionId}
              key={optionId}
              label={filteredOptions[i].label}
              selected={value === filteredOptions[i].value}
              value={filteredOptions[i].value}
              onClick={handleToggleSelectedOption}
              onKeyDown={handleOptionKeyDown}
            />,
          )
        }
      }

      return result
    },
    [id, value, filteredOptions, handleToggleSelectedOption, hideFirstOption],
  )

  return (
    <div className="relative" ref={ref}>
      <div className="relative flex flex-1">
        <Input
          className={className}
          placeholder={'Type to search...'}
          ref={inputRef}
          required={required}
          type="text"
          value={searchValue}
          onChange={(evt) => setSearchValue(evt.target.value.toLowerCase())}
          onClick={handleInputFocus}
          onKeyDown={handleInputKeyDown}
        ></Input>
        {withClear && <ClearButton className="right-4" onClick={handleClear} />}
      </div>
      <Picker
        id={id}
        className={pickerClassName}
        options={virtualOptions}
        show={showPicker}
      />
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
