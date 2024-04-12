import { useState } from 'react'

import cx from 'classnames'

import { robotoCondensed } from '@ors/themes/fonts'

const RadioOn = () => {
  return (
    <div className="rounded-full border border-solid border-primary bg-primary p-1">
      <div className="h-2 w-2 rounded-full bg-mlfs-hlYellow"></div>
    </div>
  )
}

const RadioOff = () => {
  return (
    <div className="rounded-full border border-solid border-primary p-1">
      <div className="h-2 w-2 rounded-full"></div>
    </div>
  )
}

const RadioSelectOption = ({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean
  label: string
  onClick: () => void
}) => {
  return (
    <div
      className="flex cursor-pointer items-center justify-between gap-x-2"
      onClick={onClick}
    >
      {isActive ? <RadioOn /> : <RadioOff />}
      <div className={cx('uppercase', { 'font-medium': isActive })}>
        {label}
      </div>
    </div>
  )
}

interface IRadioSelectOption {
  label: string
}

interface RadioSelectProps {
  className?: string
  initialIndex?: number
  label: string
  onChange: (option: IRadioSelectOption, index: number) => void
  options: IRadioSelectOption[]
}

const RadioSelect = ({
  className,
  initialIndex = 0,
  label,
  onChange,
  options,
}: RadioSelectProps) => {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)

  const handleClickOption = (index: number) => () => {
    setSelectedIndex(index)
    onChange(options[index], index)
  }

  return (
    <div
      className={cx(
        'flex items-center gap-x-8 rounded-lg bg-primary px-8 py-4 font-normal',
        robotoCondensed.className,
        className,
      )}
    >
      <div className="font-light uppercase text-mlfs-hlYellow">{label}</div>
      <div className="flex items-center justify-between gap-x-4 rounded-lg bg-white px-4 py-2">
        {options.map((option, index) => (
          <RadioSelectOption
            key={index}
            isActive={index == selectedIndex}
            label={option.label}
            onClick={handleClickOption(index)}
          />
        ))}
      </div>
    </div>
  )
}

export default RadioSelect
