import cx from 'classnames'

import Link from '@ors/components/ui/Link/Link'

import {
  IoAddCircle,
  IoDownloadOutline,
  IoPrintOutline,
  IoRemoveCircle,
} from 'react-icons/io5'

function BaseButton(props) {
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

function CancelButton(props) {
  const { className, ...rest } = props
  return (
    <BaseButton
      className={cx(
        'border-gray-600 bg-gray-600 text-white outline-1 outline-primary hover:outline',
        className,
      )}
      type="button"
      {...rest}
    />
  )
}

function SubmitButton(props) {
  const { className, ...rest } = props
  return (
    <BaseButton
      className={cx(
        'border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow',
        className,
      )}
      type="submit"
      {...rest}
    />
  )
}

function AddButton(props) {
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

function PrintButton(props) {
  const { children, className, iconSize, ...rest } = props
  return (
    <button
      className={cx(
        'flex cursor-pointer items-center gap-x-2 border-none bg-transparent text-primary no-underline',
        className,
      )}
      style={{ fontFamily: 'var(--font-roboto-condensed)' }}
      {...rest}
    >
      {children}
      <IoPrintOutline className="text-secondary" size={iconSize || 18} />
    </button>
  )
}

function DownloadLink(props) {
  const { children, className, iconSize, ...rest } = props
  return (
    <Link
      className={cx(
        'flex cursor-pointer items-center gap-x-2 text-primary no-underline',
        className,
      )}
      target="_blank"
      download
      {...rest}
    >
      {children}
      <IoDownloadOutline className="text-secondary" size={iconSize || 18} />
    </Link>
  )
}

function DeleteButton(props) {
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

export {
  AddButton,
  BaseButton,
  CancelButton,
  DeleteButton,
  DownloadLink,
  PrintButton,
  SubmitButton,
}
