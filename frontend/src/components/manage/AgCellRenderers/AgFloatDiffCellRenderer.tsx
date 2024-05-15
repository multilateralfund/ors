'use client'
import { Tooltip } from '@mui/material'
import { Typography } from '@mui/material'
import { CustomCellRendererProps } from 'ag-grid-react'
import { get, includes, isNull, isUndefined } from 'lodash'

import aggFuncs from '@ors/config/Table/aggFuncs'

import AgSkeletonCellRenderer from '@ors/components/manage/AgCellRenderers/AgSkeletonCellRenderer'
import { getDecimalCellValue } from '@ors/components/manage/Utils/DecimalCellValue'
import { fixFloat, parseNumber } from '@ors/helpers/Utils/Utils'

export default function AgFloatDiffCellRenderer(props: CustomCellRendererProps) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  let value = null
  let valueGWP: null | number = null
  let valueODP: null | number = null

  let valueOld = null
  let valueGWPOld: null | number = null
  let valueODPOld: null | number = null

  const aggFunc = get(aggFuncs, (props.colDef?.orsAggFunc || '') as string)

  if (includes(['control', 'group', 'hashed', 'control'], props.data.rowType)) {
    return null
  }
  /* TODO: what should I do with the below check?
     What if it has unparsable props.value, but it's got value_old?
     Do I need a custom `CustomCellRendererProps` ?
     Or do I check props.data ?
  */
  if (
    props.column?.getColId() === 'manufacturing_blends' &&
    includes(['V'], props.context.variant.model) &&
    props.data?.substance_id &&
    !parseFloat(props.value)
  ) {
    return null
  }
  if (
    props.column?.getColId() === 'production' &&
    includes(['V'], props.context.variant.model) &&
    props.data?.blend_id &&
    !parseFloat(props.value)
  ) {
    return null
  }
  if (aggFunc && includes(['subtotal', 'total'], props.data.rowType)) {
    value = fixFloat(aggFunc({ ...props }))
  } else {
    value = parseNumber(props.value)
    valueGWP = props.colDef ? props.data[`${props.colDef.field}_gwp`] : null
    valueODP = props.colDef ? props.data[`${props.colDef.field}_odp`] : null

    valueOld = props.colDef ? props.data[`${props.colDef.field}_old`] : null
    valueGWPOld = props.colDef ? props.data[`${props.colDef.field}_gwp_old`] : null
    valueODPOld = props.colDef ? props.data[`${props.colDef.field}_odp_old`] : null
  }

  if (isUndefined(value)) {
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
      <Typography className={props.className} component="span" lineHeight={1}>
        {formattedValue}<br/>({formattedValueOld})
      </Typography>
    </Tooltip>
  )
}
