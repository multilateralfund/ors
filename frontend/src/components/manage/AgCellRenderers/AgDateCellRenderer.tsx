'use client'
import { Typography } from '@mui/material'
import dayjs from 'dayjs'

import AgSkeletonCellRenderer from './AgSkeletonCellRenderer'

export default function AgDateCellRenderer(props: any) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  const value = dayjs(props.value).format('DD/MM/YYYY')
  const finalValue = value !== 'Invalid Date' ? value : null
  return !!props.value && <Typography component="span">{finalValue}</Typography>
}
