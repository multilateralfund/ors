'use client'
import { Tooltip } from '@mui/material'
import { Typography } from '@mui/material'
import { CustomCellRendererProps } from 'ag-grid-react'
import { get, includes, isNull, isUndefined } from 'lodash'

import aggFuncs from '@ors/config/Table/aggFuncs'

import AgSkeletonCellRenderer from '@ors/components/manage/AgCellRenderers/AgSkeletonCellRenderer'
import { formatDecimalValue, parseNumber } from '@ors/helpers/Utils/Utils'

export default function AgFloatCellRenderer(props: CustomCellRendererProps) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  let value = null
  const aggFunc = get(aggFuncs, (props.colDef?.orsAggFunc || '') as string)

  if (includes(['control', 'group', 'hashed', 'control'], props.data.rowType)) {
    return null
  }
  if (aggFunc && includes(['subtotal', 'total'], props.data.rowType)) {
    value = aggFunc({ ...props })
  } else {
    value = parseNumber(props.value)
  }

  if (isUndefined(value)) {
    return null
  }

  if (isNull(value)) {
    value = 0
  }

  const formattedValue = formatDecimalValue(value, props)

  return (
    <Tooltip
      enterDelay={300}
      placement={'top-start'}
      title={value ? value.toLocaleString() : value}
    >
      <Typography className={props.className} component="span" lineHeight={1}>
        {formattedValue}
      </Typography>
    </Tooltip>
  )
}
