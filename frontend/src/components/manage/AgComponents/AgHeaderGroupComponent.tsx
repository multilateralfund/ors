'use client'
import { Typography } from '@mui/material'

export default function AgHeaderGroupComponent(props: any) {
  return (
    <Typography className={props.className} component="span">
      {props.displayName}
    </Typography>
  )
}
