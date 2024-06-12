import cx from 'classnames'

import { IoAddCircle, IoRemoveCircle } from 'react-icons/io5'

function BaseButton(props: any) {
  const { children, className, onClick, ...rest } = props
  return (
    <button
      className={cx(
        'flex cursor-pointer items-center rounded-lg border border-solid px-3 py-2.5 text-base font-medium uppercase transition-all',
        className,
      )}
      style={{ fontFamily: 'var(--font-roboto-condensed)' }}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  )
}

function CancelButton(props: any) {
  return (
    <BaseButton
      className="border-gray-600 bg-gray-600 text-white outline-1 outline-primary hover:outline"
      type="button"
      {...props}
    />
  )
}

function SubmitButton(props: any) {
  return (
    <BaseButton
      className="border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow"
      type="submit"
      {...props}
    />
  )
}

function AddButton(props: any) {
  const { children, className, iconSize, ...rest } = props
  return (
    <BaseButton
      className={cx(
        'border-primary bg-white text-primary hover:bg-primary hover:text-mlfs-hlYellow',
        className,
      )}
      {...rest}
    >
      {children}
      <IoAddCircle className="ml-1.5" size={iconSize || 18} />
    </BaseButton>
  )
}

function DeleteButton(props: any) {
  const { children, className, iconSize, ...rest } = props
  return (
    <BaseButton
      className={cx(
        'border-error bg-white text-error hover:bg-error hover:text-mlfs-hlYellow',
        className,
      )}
      {...rest}
    >
      {children}
      <IoRemoveCircle className="ml-1.5" size={iconSize || 18} />
    </BaseButton>
  )
}

export { AddButton, BaseButton, CancelButton, DeleteButton, SubmitButton }
