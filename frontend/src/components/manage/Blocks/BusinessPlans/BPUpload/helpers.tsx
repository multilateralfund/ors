import { ReactNode } from 'react'

interface ILabel {
  children: ReactNode
  isRequired?: boolean
  htmlFor?: string
}

export const Label = ({ children, htmlFor, isRequired = false }: ILabel) => (
  <label
    htmlFor={htmlFor}
    className="mb-2 block text-lg font-normal text-gray-900"
  >
    {children}
    <sup className="font-bold"> {isRequired && '*'}</sup>
  </label>
)
