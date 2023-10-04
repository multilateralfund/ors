'use client'
import { Typography } from '@mui/material'
import { get, includes, isNull, isUndefined } from 'lodash'

import { aggFuncs } from '@ors/config/Table'

import AgSkeletonCellRenderer from '@ors/components/manage/AgCellRenderers/AgSkeletonCellRenderer'
import AgTooltipComponent from '@ors/components/manage/AgComponents/AgTooltipComponent'
import { parseNumber } from '@ors/helpers/Utils/Utils'

export default function AgFloatCellRenderer(props: any) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  let value = null
  const aggFunc = get(aggFuncs, props.colDef.aggFunc)

  if (includes(['control', 'group'], props.data.rowType)) {
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

  const formattedValue = value.toLocaleString(undefined, {
    minimumFractionDigits: props.minimumFractionDigits || 2,
  })

  return (
    <AgTooltipComponent {...props} value={formattedValue}>
      <Typography className={props.className} component="span">
        {formattedValue}
      </Typography>
    </AgTooltipComponent>
  )
}
