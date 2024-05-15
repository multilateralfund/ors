'use client'
import { Tooltip, Typography } from '@mui/material'
import { CustomCellRendererProps } from 'ag-grid-react'
import { each, find, get, includes, isNull, isUndefined } from 'lodash'

import aggFuncs from '@ors/config/Table/aggFuncs'

import AgSkeletonCellRenderer from '@ors/components/manage/AgCellRenderers/AgSkeletonCellRenderer'
import { getDecimalCellValue } from '@ors/components/manage/Utils/DecimalCellValue'
import {
  getUnitAwareValue,
  parseNumber,
  sumFloats,
} from '@ors/helpers/Utils/Utils'

export default function AgUsageDiffCellRenderer(props: CustomCellRendererProps) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  let value: any = null
  let valueGWP: null | number = null
  let valueODP: null | number = null
  let valueOld: any = null
  let valueGWPOld: null | number = null
  let valueODPOld: null | number = null


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
    //TODO: these rows should be excluded
    value = aggFunc({ ...props })
  } else if (usageId === 'total_usages') {
    //TODO: these might have to be excluded as well
    value = []
    valueOld = []
    each(recordUsages, (usage: any) => {
      const quantity = getUnitAwareValue(usage, 'quantity', props.context.unit)
      if (!isNull(quantity)) {
        value.push(quantity)
      }
      const quantityOld = getUnitAwareValue(usage, 'quantity_old', props.context.unit)
      if (!isNull(quantityOld)) {
        valueOld.push(quantityOld)
      }
    })
    value = value.length > 0 ? sumFloats(value) : 0
    valueOld = valueOld.length > 0 ? sumFloats(valueOld) : 0
  } else if (usageId === 'total_refrigeration') {
    //TODO: should these be excluded?
    value = []
    valueOld = []
    each(recordUsages, (usage: any) => {
      const quantity = getUnitAwareValue(usage, 'quantity', props.context.unit)
      const quantityOld = getUnitAwareValue(usage, 'quantity_old', props.context.unit)
      if (!isNull(quantity) && includes([6, 7], usage.usage_id)) {
        value.push(quantity)
      }
      if (!isNull(quantityOld) && includes([6, 7], usage.usage_id)) {
        valueOld.push(quantityOld)
      }
    })
    value = value.length > 0 ? sumFloats(value) : undefined
    valueOld = valueOld.length > 0 ? sumFloats(valueOld) : undefined
  } else {
    const usage = find(recordUsages, (item) => item.usage_id === usageId)
    value = parseNumber(usage?.quantity)
    valueGWP = usage?.quantity_gwp
    valueODP = usage?.quantity_odp
    valueOld = parseNumber(usage?.quantity_old)
    valueGWPOld = usage?.quantity_gwp_old
    valueODPOld = usage?.quantity_odp_old
  }

  if (isUndefined(value) && isUndefined(valueOld)) {
    return null
  }

  if (isNull(value)) {
    value = 0
  }

  if (isNull(valueOld)) {
    valueOld = 0
  }

  const { TitleContent, formattedValue } = getDecimalCellValue(
    value,
    valueODP,
    valueGWP,
    props,
  )

  const ReturnOld = getDecimalCellValue(
    valueOld,
    valueODPOld,
    valueGWPOld,
    props,
  )
  const formattedValueOld = ReturnOld.formattedValue

  return (
    <Tooltip enterDelay={300} placement={'top-start'} title={TitleContent}>
      <Typography className={props.className} component="span" lineHeight={2}>
        {formattedValue}<br/>({formattedValueOld})
      </Typography>
    </Tooltip>
  )
}

