'use client'

import { useLocation } from "wouter";

import SimpleSelect from '@ors/components/ui/SimpleSelect/SimpleSelect'

import { PeriodSelectorOption, PeriodSelectorProps } from './types'
import { getPathPeriod } from './utils'

function isYear(period?: null | string) {
  if (period) {
    return /^\d{4}$/.test(period)
  }
  return false
}

function PeriodSelector(props: PeriodSelectorProps) {
  const {
    label = 'Period',
    onChange,
    period,
    periodOptions,
    selectedPeriod,
  } = props

  const [pathname, setLocation] = useLocation()

  const basePath =
    getPathPeriod(pathname) || isYear(props.period)
      ? pathname.split('/').slice(0, -1).join('/')
      : pathname

  const options: PeriodSelectorOption[] = []
  let selectedIndex = 0

  for (let i = 0; i < periodOptions.length; i++) {
    options.push(periodOptions[i])

    if (
      periodOptions[i].value === period ||
      periodOptions[i].value === selectedPeriod
    ) {
      selectedIndex = i
    }
  }

  function handleChange(option: PeriodSelectorOption) {
    const newPath = `${basePath}/${option.value}`
    if (onChange) {
      onChange(newPath, { basePath, option })
    } else {
      setLocation(newPath)
    }
  }

  return (
    <div className="flex w-full justify-end">
      <SimpleSelect
        initialIndex={selectedIndex}
        label={label}
        options={options}
        onChange={handleChange}
      />
    </div>
  )
}

export default PeriodSelector
