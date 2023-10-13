'use client'
import { Typography } from '@mui/material'
import { each, find, get, includes, isNull, isUndefined, sum } from 'lodash'

import aggFuncs from '@ors/config/Table/aggFuncs'

import AgSkeletonCellRenderer from '@ors/components/manage/AgCellRenderers/AgSkeletonCellRenderer'
import AgTooltipComponent from '@ors/components/manage/AgComponents/AgTooltipComponent'
import { parseNumber } from '@ors/helpers/Utils/Utils'

export default function AgUsageCellRenderer(props: any) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  let value: any = null
  const aggFunc = get(aggFuncs, props.colDef.aggFunc)
  const usageId = props.colDef.id
  const recordUsages = props.data.record_usages || []

  if (
    includes(['group', 'control'], props.data.rowType) ||
    includes(props.data.excluded_usages, usageId)
  ) {
    return null
  }
  if (aggFunc && includes(['subtotal', 'total'], props.data.rowType)) {
    value = aggFunc({ ...props })
  } else if (usageId === 'total_usages') {
    value = []
    each(recordUsages, (usage: any) => {
      const quantity = parseNumber(usage.quantity)
      if (!isNull(quantity)) {
        value.push(quantity)
      }
    })
    value = value.length > 0 ? sum(value) : undefined
  } else if (usageId === 'total_refrigeration') {
    value = []
    each(recordUsages, (usage: any) => {
      const quantity = parseNumber(usage.quantity)
      if (!isNull(quantity) && includes([6, 7], usage.usage_id)) {
        value.push(quantity)
      }
    })
    value = value.length > 0 ? sum(value) : undefined
  } else {
    const usage = find(recordUsages, (item) => item.usage_id === usageId)
    value = parseNumber(usage?.quantity)
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
