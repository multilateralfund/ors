import type { LinkProps } from '@mui/material'

import { Link as MuiLink } from '@mui/material'
import NextLink from 'next/link'

export default function Link({ children, ...rest }: LinkProps) {
  return (
    <MuiLink component={NextLink} {...rest}>
      {children}
    </MuiLink>
  )
}
