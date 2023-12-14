'use client'
import { Skeleton, Typography } from '@mui/material'

export default function AgSkeletonCellRenderer(props: any) {
  return (
    <Typography
      className={props.className}
      component="span"
      style={{ lineHeight: `${props.node.rowHeight / 2}px` }}
    >
      <Skeleton className="inline-block w-full" />
    </Typography>
  )
}
