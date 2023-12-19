'use client'
import type {
  ButtonProps as MuiButtonProps,
  LinkProps as MuiLinkProps,
} from '@mui/material'

import { Button, Link as MuiLink } from '@mui/material'
import cx from 'classnames'
import NextLink, { LinkProps as NextLinkProps } from 'next/link'

export type LinkProps = MuiLinkProps &
  NextLinkProps & { button?: false; href: string }
export type ButtonProps = MuiButtonProps & { button: true; href: string }

function Link({
  button,
  children,
  className,
  ...rest
}: ButtonProps | LinkProps) {
  return button ? (
    // @ts-ignore
    <Button
      className={cx('text-center', className)}
      component={NextLink}
      {...rest}
    >
      {children}
    </Button>
  ) : (
    // @ts-ignore
    <MuiLink className={className} component={NextLink} {...rest}>
      {children}
    </MuiLink>
  )
}

export default Link
