import { ButtonHTMLAttributes } from 'react'

import cx from 'classnames'

import Link, { LinkProps } from '@ors/components/ui/Link/Link'

import {
  IoAddCircle,
  IoDownloadOutline,
  IoPrintOutline,
  IoRemoveCircle,
} from 'react-icons/io5'

interface BaseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}
function BaseButton(props: BaseButtonProps) {
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

function CancelButton(props: BaseButtonProps) {
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

function SubmitButton(props: BaseButtonProps) {
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

interface AddButtonProps extends BaseButtonProps {
  iconSize?: number
}

function AddButton(props: AddButtonProps) {
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

interface PrintButtonProps extends BaseButtonProps {
  iconSize?: number
}

function PrintButton(props: PrintButtonProps) {
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

interface DownloadLinkProps extends LinkProps {
  iconSize?: number
  iconClassname?: string
}

function DownloadLink(props: DownloadLinkProps) {
  const { children, className, iconSize, iconClassname, ...rest } = props
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
      <IoDownloadOutline
        className={cx('text-secondary', iconClassname)}
        size={iconSize || 18}
      />
    </Link>
  )
}

interface DeleteButtonProps extends BaseButtonProps {
  iconSize?: number
}

function DeleteButton(props: DeleteButtonProps) {
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
