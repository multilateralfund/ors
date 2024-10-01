import cx from 'classnames'

import { IClearButtonProps } from './types'

import { IoClose } from 'react-icons/io5'

export default function ClearButton(props: IClearButtonProps) {
  const { className, onClick } = props
  return (
    <button
      className={cx(
        'absolute top-0 h-full border-0 bg-transparent px-2 text-gray-500 hover:cursor-pointer hover:text-secondary',
        className,
      )}
      aria-label="Clear selection"
      type="button"
      onClick={onClick}
    >
      <IoClose size={16} />
    </button>
  )
}
