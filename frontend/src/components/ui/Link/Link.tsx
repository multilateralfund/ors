import { forwardRef } from 'react'

import type {
  ButtonProps as MuiButtonProps,
  LinkProps as MuiLinkProps,
} from '@mui/material'

import { Button, Link as MuiLink } from '@mui/material'
import cx from 'classnames'
import { Link as WouterLink } from 'wouter'

export type LinkProps = { button?: false; href: string } & MuiLinkProps

export type ButtonProps = { button: true; href: string } & MuiButtonProps

function isInternalLink(url: string) {
  return (
    (url.startsWith('/') || url.startsWith(location.origin)) &&
    url.indexOf('/api/') == -1 &&
    url.indexOf('/static/') == -1
  )
}

const Link = forwardRef<any, any>(function Link(
  { button, children, className, download, ...rest }: any,
  ref: any,
) {
  const isInternal = isInternalLink(rest.href || '')
  const component = isInternal ? WouterLink : 'a'

  return button ? (
    // @ts-ignore
    <Button
      ref={ref}
      className={cx('text-center', className)}
      component={component}
      {...rest}
    >
      {children}
    </Button>
  ) : (
    // @ts-ignore
    <MuiLink ref={ref} className={className} component={component} {...rest}>
      {children}
    </MuiLink>
  )
})

export default Link
