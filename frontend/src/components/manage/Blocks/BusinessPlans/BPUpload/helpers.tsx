import { ReactNode } from 'react'
import cx from 'classnames'

interface ILabel {
  children: ReactNode
  isRequired?: boolean
  htmlFor?: string
  className?: string
}

export const Label = ({
  children,
  htmlFor,
  isRequired = false,
  className,
}: ILabel) => (
  <label
    htmlFor={htmlFor}
    className={cx('mb-2 block text-lg font-normal text-gray-900', className)}
  >
    {children}
    <sup className="font-bold"> {isRequired && '*'}</sup>
  </label>
)
