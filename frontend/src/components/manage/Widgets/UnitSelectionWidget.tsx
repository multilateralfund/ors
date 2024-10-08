import { useState } from 'react'

import cx from 'classnames'

import useClickOutside from '@ors/hooks/useClickOutside'

import { IoChevronDown } from 'react-icons/io5'

const OPTIONS: IOption[] = [
  { label: 'Metric tonnes', value: 'mt' },
  {
    label: (
      <>
        CO<sub>2</sub>-eq tonnes
      </>
    ),
    value: 'gwp',
  },
  { label: 'ODP tonnes', value: 'odp' },
]

const OPTIONS_A: IOption[] = [
  { label: 'Metric tonnes', value: 'mt' },
  { label: 'ODP tonnes', value: 'odp' },
]

const OPTIONS_B: IOption[] = [
  { label: 'Metric tonnes', value: 'mt' },
  {
    label: (
      <>
        CO<sub>2</sub>-eq tonnes
      </>
    ),
    value: 'gwp',
  },
]

interface IOption {
  label: JSX.Element | string
  value: string
}

interface UnitSelectionWidgetProps {
  className?: string
  gridContext?: any
  onChange: (option: IOption, index: number) => void
}

function UnitSelectionWidget(props: UnitSelectionWidgetProps) {
  const { className, gridContext, onChange } = props

  let options = OPTIONS

  switch (gridContext.section?.id) {
    case 'section_a':
      options = OPTIONS_A
      break
    case 'section_b':
      options = OPTIONS_B
      break
  }

  let selectedIndex = gridContext.unit
    ? options.map((o) => o.value).indexOf(gridContext.unit)
    : 0
  selectedIndex = selectedIndex == -1 ? 0 : selectedIndex

  const [showMenu, setShowMenu] = useState(false)

  const toggleShowMenu = () => setShowMenu((prev) => !prev)

  const handleClickOption = (index: number) => () => {
    setShowMenu(false)
    onChange(options[index], index)
  }

  const ref = useClickOutside<HTMLDivElement>(() => {
    setShowMenu(false)
  })

  return (
    <div className={cx('relative', className)}>
      <div
        className="flex cursor-pointer items-center justify-between gap-x-2 hover:text-primary"
        ref={ref}
        onClick={toggleShowMenu}
      >
        <div className="">{options[selectedIndex].label}</div>
        <IoChevronDown className="" />
      </div>
      <div
        className={cx(
          'absolute left-0 z-10 max-h-[200px] origin-top overflow-y-auto rounded-none border border-solid border-primary bg-gray-A100 opacity-0 transition-all',
          {
            'collapse scale-y-0': !showMenu,
            'scale-y-100 opacity-100': showMenu,
          },
        )}
      >
        {options.map((option, idx) => (
          <div
            key={idx}
            className="flex cursor-pointer items-center gap-x-2 rounded-none px-2 py-2 text-black no-underline hover:bg-primary hover:text-white"
            onClick={handleClickOption(idx)}
          >
            <div className="flex w-56 items-center justify-between hover:text-white">
              <div>{option.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default UnitSelectionWidget
