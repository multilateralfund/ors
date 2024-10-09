'use client'
import { Tooltip, Typography } from '@mui/material'
import { CustomCellRendererProps } from 'ag-grid-react'
import cx from 'classnames'
import dayjs from 'dayjs'
import { isUndefined } from 'lodash'

import DiffTooltipHeader from '@ors/components/ui/DiffUtils/DiffTooltipHeader'

import { highlightCell } from '../Utils/diffUtils'
import AgSkeletonCellRenderer from './AgSkeletonCellRenderer'

export default function AgDateDiffCellRenderer(props: CustomCellRendererProps) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  if (isUndefined(props.value)) {
    return null
  }

  const formatDate = (date: string) => {
    const formattedDate = dayjs(date).format('DD/MM/YYYY')
    return formattedDate !== 'Invalid Date' ? formattedDate : null
  }

  const bannedDateData =
    props.column?.getColId() === 'banned_date'
      ? {
          newDate: formatDate(props.value),
          oldDate: formatDate(props.data.banned_date_old),
        }
      : {}

  const new_value = bannedDateData?.newDate
  const old_value = bannedDateData?.oldDate

  return (
    <Tooltip
      enterDelay={300}
      placement={'top'}
      title={<DiffTooltipHeader {...{ new_value, old_value }} />}
    >
      <Typography
        className={cx(
          props.className,
          `${highlightCell(new_value, old_value, props.data?.change_type)}`,
        )}
        component="span"
        lineHeight={1}
      >
        {new_value || '-'}
      </Typography>
    </Tooltip>
  )
}
