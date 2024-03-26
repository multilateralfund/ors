'use client'
import { Typography } from '@mui/material'
import { CustomCellRendererProps } from 'ag-grid-react'
import { each, find, get, includes, isNull, isUndefined, sum } from 'lodash'

import aggFuncs from '@ors/config/Table/aggFuncs'

import AgSkeletonCellRenderer from '@ors/components/manage/AgCellRenderers/AgSkeletonCellRenderer'
import AgTooltipComponent from '@ors/components/manage/AgComponents/AgTooltipComponent'
import { formatDecimalValue, parseNumber } from '@ors/helpers/Utils/Utils'

export default function AgUsageCellRenderer(props: CustomCellRendererProps) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  let value: any = null
  const aggFunc = get(aggFuncs, props.colDef?.orsAggFunc || '')
  const usageId = props.colDef?.id
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
    value = value.length > 0 ? sum(value) : 0
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

  const formattedValue = formatDecimalValue(value, props)

  return (
    <AgTooltipComponent {...props} value={formattedValue}>
      <Typography className={props.className} component="span" lineHeight={1}>
        {formattedValue}
      </Typography>
    </AgTooltipComponent>
  )
}
