import { ReactNode } from 'react'

import { PeriodSelectorOption } from '../../Replenishment/types'

interface ILabel {
  children: ReactNode
  isRequired?: boolean
}

export const Label = ({ children, isRequired = false }: ILabel) => (
  <label className="mb-2 block text-lg font-normal text-gray-900">
    {children}
    <sup className="font-bold"> {isRequired && '*'}</sup>
  </label>
)
