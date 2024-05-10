'use client'
import { Tooltip, Typography } from '@mui/material'
import { CustomCellRendererProps } from 'ag-grid-react'
import { each, find, get, includes, isNull, isUndefined } from 'lodash'

import aggFuncs from '@ors/config/Table/aggFuncs'

import AgSkeletonCellRenderer from '@ors/components/manage/AgCellRenderers/AgSkeletonCellRenderer'
import {
  formatDecimalValue,
  parseNumber,
  sumFloats,
} from '@ors/helpers/Utils/Utils'

export default function AgUsageCellRenderer(props: CustomCellRendererProps) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  let value: any = null
  let valueGWP: null | number = null
  let valueODP: null | number = null

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
    value = value.length > 0 ? sumFloats(value) : 0
  } else if (usageId === 'total_refrigeration') {
    value = []
    each(recordUsages, (usage: any) => {
      const quantity = parseNumber(usage.quantity)
      if (!isNull(quantity) && includes([6, 7], usage.usage_id)) {
        value.push(quantity)
      }
    })
    value = value.length > 0 ? sumFloats(value) : undefined
  } else {
    const usage = find(recordUsages, (item) => item.usage_id === usageId)
    value = parseNumber(usage?.quantity)
    valueGWP = usage?.quantity_gwp
    valueODP = usage?.quantity_odp
  }

  if (isUndefined(value)) {
    return null
  }

  if (isNull(value)) {
    value = 0
  }

  const formattedValue = formatDecimalValue(value, props)

  const TitleContent =
    valueGWP != null && valueODP != null ? (
      <div className="flex flex-col gap-1">
        <span>Metric tons: {value}</span>
        <span>GWP: {valueGWP}</span>
        <span>ODP tones: {valueODP}</span>
      </div>
    ) : (
      <span>{value}</span>
    )

  return (
    <Tooltip enterDelay={300} placement={'top-start'} title={TitleContent}>
      <Typography className={props.className} component="span" lineHeight={1}>
        {formattedValue}
      </Typography>
    </Tooltip>
  )
}
