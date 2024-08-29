'use client'
import { Tooltip, Typography } from '@mui/material'
import { CustomCellRendererProps } from 'ag-grid-react'
import { each, find, get, includes, isNull, isUndefined } from 'lodash'

import aggFuncs from '@ors/config/Table/aggFuncs'

import AgSkeletonCellRenderer from '@ors/components/manage/AgCellRenderers/AgSkeletonCellRenderer'
import { getDecimalCellValue } from '@ors/components/manage/Utils/DecimalCellValue'
import { convertValue, parseNumber, sumFloats } from '@ors/helpers/Utils/Utils'

export default function AgUsageCellRenderer(props: CustomCellRendererProps) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  let value: any = null
  let valueMT: null | number = null
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
    valueMT = aggFunc({ ...props, unitOverride: 'mt' })
    valueGWP = aggFunc({ ...props, unitOverride: 'gwp' })
    valueODP = aggFunc({ ...props, unitOverride: 'odp' })
  } else if (usageId === 'total_usages') {
    value = []
    const _valueMT: number[] = []
    const _valueGWP: number[] = []
    const _valueODP: number[] = []
    each(recordUsages, (usage: any) => {
      const convertedValue = convertValue(
        usage.quantity,
        props.data.gwp,
        props.data.odp,
      )
      const quantity = convertedValue[props.context?.unit ?? 'mt']
      const quantityMT = convertedValue['mt']
      const quantityGWP = convertedValue['gwp']
      const quantityODP = convertedValue['odp']
      if (!isNull(quantity)) {
        value.push(quantity)
      }
      if (!isNull(quantityMT)) {
        _valueMT.push(quantityMT)
      }
      if (!isNull(quantityGWP)) {
        _valueGWP.push(quantityGWP)
      }
      if (!isNull(quantityODP)) {
        _valueODP.push(quantityODP)
      }
    })
    value = value.length > 0 ? sumFloats(value) : 0
    valueMT = _valueMT.length > 0 ? sumFloats(_valueMT) : 0
    valueGWP = _valueGWP.length > 0 ? sumFloats(_valueGWP) : 0
    valueODP = _valueODP.length > 0 ? sumFloats(_valueODP) : 0
  } else if (usageId === 'total_refrigeration') {
    value = []
    each(recordUsages, (usage: any) => {
      const quantity = convertValue(usage?.quantity, props.data.gwp, props.data.odp)[props.context?.unit]
      if (!isNull(quantity) && includes([6, 7], usage.usage_id)) {
        value.push(quantity)
      }
    })
    value = value.length > 0 ? sumFloats(value) : undefined
    valueMT = value
  } else {
    const usage = find(recordUsages, (item) => item.usage_id === usageId)
    const convertedValue = convertValue(
      usage?.quantity,
      props.data.gwp,
      props.data.odp,
    )
    value = parseNumber(usage?.quantity)
    valueMT = convertedValue['mt']
    valueGWP = convertedValue['gwp']
    valueODP = convertedValue['odp']
  }

  if (isUndefined(value)) {
    return null
  }

  if (isNull(value)) {
    value = 0
  }

  if (isNull(valueMT)) {
    valueMT = 0
  }

  const { TitleContent, formattedValue } = getDecimalCellValue(
    valueMT,
    valueODP,
    valueGWP,
    props,
  )

  return (
    <Tooltip enterDelay={300} placement={'top-start'} title={TitleContent}>
      <Typography className={props.className} component="span" lineHeight={1}>
        {formattedValue}
      </Typography>
    </Tooltip>
  )
}
