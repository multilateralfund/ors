'use client'
import type {
  ButtonProps as MuiButtonProps,
  LinkProps as MuiLinkProps,
} from '@mui/material'

import { Button, Link as MuiLink } from '@mui/material'
import cx from 'classnames'
import { Link as WouterLink } from 'wouter'

export type LinkProps = { button?: false; href: string } & MuiLinkProps

export type ButtonProps = { button: true; href: string } & MuiButtonProps


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
      component={WouterLink}
      {...rest}
    >
      {children}
    </Button>
  ) : (
    // @ts-ignore
    <MuiLink className={className} component={WouterLink} {...rest}>
      {children}
    </MuiLink>
  )
}

export default Link
