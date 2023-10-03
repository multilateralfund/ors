'use client'
import { Skeleton, Typography } from '@mui/material'

export default function AgSkeletonCellRenderer(props: any) {
  return (
    <Typography className={props.className} component="span">
      <Skeleton className="inline-block w-full" />
    </Typography>
  )
}
