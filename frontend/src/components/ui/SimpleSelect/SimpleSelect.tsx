import { useState } from 'react'

import { IoChevronDownCircle } from '@react-icons/all-files/io5/IoChevronDownCircle'
import cx from 'classnames'
import { AnimatePresence } from 'framer-motion'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import { robotoCondensed } from '@ors/themes/fonts'

interface ISimpleSelectOption {
  label: string
}

export interface SimpleSelectProps {
  className?: string
  initialIndex?: number
  label: string
  onChange: (option: ISimpleSelectOption, index: number) => void
  options: ISimpleSelectOption[]
}

const SimpleSelect = ({
  className,
  initialIndex = 0,
  label,
  onChange,
  options,
}: SimpleSelectProps) => {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)
  const [showMenu, setShowMenu] = useState(false)

  const handleClickOption = (index: number) => () => {
    setSelectedIndex(index)
    setShowMenu(false)
    onChange(options[index], index)
  }

  const toggleShowMenu = () => setShowMenu((prev) => !prev)

  return (
    <div
      className={cx(
        'flex items-center justify-between gap-x-2 text-lg uppercase',
        robotoCondensed.className,
        className,
      )}
    >
      <div className="font-light">{label}</div>
      <div className="relative">
        <div
          className="flex cursor-pointer items-center justify-between gap-x-5 rounded-lg border-2 border-solid border-primary px-2 py-2"
          onClick={toggleShowMenu}
        >
          <div>{options[selectedIndex].label}</div>
          <IoChevronDownCircle className="text-xl" />
        </div>
        <AnimatePresence>
          {showMenu && (
            <FadeInOut>
              <div className="absolute right-0 z-10 mt-1 flex flex-col rounded-lg bg-white font-light shadow-xl">
                {options.map((option, index) => {
                  return (
                    <div
                      key={option.label}
                      className={cx(
                        'cursor-pointer text-nowrap border border-l-0 border-r-0 border-t-0 border-solid border-b-primary px-4 py-2 text-primary no-underline transition-all first:rounded-t-lg last:rounded-b-lg last:border-b-0',
                        {
                          'bg-mlfs-hlYellowTint': index == selectedIndex,
                          'hover:bg-gray-200': index != selectedIndex,
                        },
                      )}
                      onClick={handleClickOption(index)}
                    >
                      {option.label}
                    </div>
                  )
                })}
              </div>
            </FadeInOut>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default SimpleSelect
