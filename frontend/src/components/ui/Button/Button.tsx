import cx from 'classnames'

import { IoAddCircle } from 'react-icons/io5'

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
  const { children, ...rest } = props
  return (
    <BaseButton
      className="border-primary bg-white text-primary hover:bg-primary hover:text-mlfs-hlYellow"
      {...rest}
    >
      {children}
      <IoAddCircle className="ml-1.5" size={18} />
    </BaseButton>
  )
}

export { AddButton, BaseButton, CancelButton, SubmitButton }
