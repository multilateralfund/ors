import type {
  ButtonProps as MuiButtonProps,
  LinkProps as MuiLinkProps,
} from '@mui/material'

import { Button, Link as MuiLink } from '@mui/material'
import NextLink from 'next/link'

export type LinkProps = MuiLinkProps & { button?: boolean; href: string }
export type ButtonProps = MuiButtonProps & { button?: boolean; href: string }

function Link({ button, children, ...rest }: ButtonProps | LinkProps) {
  return button ? (
    // @ts-ignore
    <Button component={NextLink} {...rest}>
      {children}
    </Button>
  ) : (
    // @ts-ignore
    <MuiLink component={NextLink} {...rest}>
      {children}
    </MuiLink>
  )
}

export default Link
