'use client'
import { Skeleton, Typography } from '@mui/material'

export default function AgSkeletonCellRenderer(props: any) {
  return (
    <Typography className={props.className} component="span" lineHeight={1}>
      <Skeleton className="inline-block w-full" />
    </Typography>
  )
}
