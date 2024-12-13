import { useEffect, useState } from 'react'

import cx from 'classnames'

import useClickOutside from '@ors/hooks/useClickOutside'

import { IoChevronDownCircle } from 'react-icons/io5'

interface ISimpleSelectOption {
  label: string
  disabled?: boolean
}

export interface SimpleSelectProps<
  T extends ISimpleSelectOption = ISimpleSelectOption,
> {
  className?: string
  initialIndex?: number
  inputClassName?: string
  menuClassName?: string
  label: string
  onChange: (option: T, index: number) => void
  options: T[]
  withDisabledOptions?: boolean
  placeholder?: string
}

const SimpleSelect = <T extends ISimpleSelectOption = ISimpleSelectOption>(
  props: SimpleSelectProps<T>,
) => {
  const {
    className,
    initialIndex = 0,
    inputClassName,
    label,
    onChange,
    options,
    menuClassName,
    withDisabledOptions,
    placeholder,
  } = props
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    setSelectedIndex(initialIndex)
  }, [initialIndex])

  const handleClickOption = (index: number) => () => {
    setSelectedIndex(index)
    setShowMenu(false)
    onChange(options[index], index)
  }

  const ref = useClickOutside<HTMLOutputElement>(function () {
    setShowMenu(false)
  })

  const toggleShowMenu = () => setShowMenu((prev) => !prev)
  const idFromLabel = label.toLowerCase().replace(' ', '_')

  return (
    <div
      className={cx(
        'flex items-center justify-between gap-x-2 text-lg uppercase',
        className,
      )}
    >
      <label className="font-light" htmlFor={idFromLabel}>
        {label}
      </label>
      <div className="relative">
        <output
          id={idFromLabel}
          className={cx(
            'flex cursor-pointer items-center justify-between gap-x-2 rounded-lg border border-solid border-primary px-2 py-2',
            inputClassName,
          )}
          ref={ref}
          onClick={toggleShowMenu}
        >
          <div>{options[selectedIndex]?.label || placeholder}</div>
          <IoChevronDownCircle className="text-xl" />
        </output>
        <menu
          className={cx(
            'absolute right-0 z-10 mt-1 flex max-h-64 origin-top list-none flex-col overflow-y-auto rounded-lg bg-white p-0 font-light opacity-0 shadow-xl transition-all',
            menuClassName,
            {
              'collapse scale-y-0': !showMenu,
              'scale-y-100 opacity-100': showMenu,
            },
          )}
        >
          {options.map((option, index) => {
            return (
              <li
                key={option.label}
                className={cx(
                  'cursor-pointer text-nowrap border border-l-0 border-r-0 border-t-0 border-solid border-b-primary px-4 py-2 text-primary no-underline transition-all first:rounded-t-lg last:rounded-b-lg last:border-b-0',
                  {
                    'bg-mlfs-hlYellowTint': index == selectedIndex,
                    'hover:bg-gray-200': index != selectedIndex,
                    'pointer-events-none opacity-40':
                      option.disabled && withDisabledOptions,
                  },
                )}
                onClick={handleClickOption(index)}
              >
                {option.label}
              </li>
            )
          })}
        </menu>
      </div>
    </div>
  )
}

export default SimpleSelect
