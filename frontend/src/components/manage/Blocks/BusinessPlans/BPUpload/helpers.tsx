import { ReactNode } from 'react'

import { PeriodSelectorOption } from '../../Replenishment/types'

interface ILabel {
  children: ReactNode
  isRequired?: boolean
}

export const getFormattedPeridOptions = (
  periodOptions: PeriodSelectorOption[],
) => {
  const lastPeriodStartYear =
    periodOptions[0]?.year_start ?? new Date().getFullYear() - 1

  const nextTrienniumStartYear = lastPeriodStartYear + 1
  const nextTriennium = `${nextTrienniumStartYear}-${nextTrienniumStartYear + 2}`

  const nextTrienniumData = {
    label: nextTriennium,
    value: nextTriennium,
    year_start: nextTrienniumStartYear,
  }

  return [nextTrienniumData, ...periodOptions]
}

export const Label = ({ children, isRequired = false }: ILabel) => (
  <label className="mb-2 block text-lg font-normal text-gray-900">
    {children}
    <sup className="font-bold"> {isRequired && '*'}</sup>
  </label>
)
