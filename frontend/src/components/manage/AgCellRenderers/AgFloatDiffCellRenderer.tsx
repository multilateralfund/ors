'use client'
import { Tooltip } from '@mui/material'
import { Typography } from '@mui/material'
import { CustomCellRendererProps } from 'ag-grid-react'
import cx from 'classnames'
import { get, includes, isNull, isUndefined } from 'lodash'

import aggFuncs from '@ors/config/Table/aggFuncs'

import AgSkeletonCellRenderer from '@ors/components/manage/AgCellRenderers/AgSkeletonCellRenderer'
import { getDecimalCellValue } from '@ors/components/manage/Utils/DecimalCellValue'
import { highlightCell } from '@ors/components/manage/Utils/diffUtils'
import DiffTooltipHeader from '@ors/components/ui/DiffUtils/DiffTooltipHeader'
import { fixFloat, parseNumber } from '@ors/helpers/Utils/Utils'

export default function AgFloatDiffCellRenderer(
  props: CustomCellRendererProps,
) {
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

  if (includes(['control', 'group', 'hashed'], props.data.rowType)) {
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

    valueOld = props.colDef
      ? parseNumber(props.data[`${props.colDef.field}_old`])
      : null
    valueGWPOld = props.colDef
      ? props.data[`${props.colDef.field}_gwp_old`]
      : null
    valueODPOld = props.colDef
      ? props.data[`${props.colDef.field}_odp_old`]
      : null
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

  const { formattedValue } = getDecimalCellValue(
    value,
    valueODP,
    valueGWP,
    props,
  )

  const { formattedValue: old_value } = getDecimalCellValue(
    valueOld,
    valueODPOld,
    valueGWPOld,
    props,
  )

  const new_value = props.data?.change_type === 'deleted' ? '-' : formattedValue

  return (
    <Tooltip
      enterDelay={300}
      placement={'top'}
      title={<DiffTooltipHeader new_value={new_value} old_value={old_value} />}
    >
      <Typography
        className={cx(
          props.className,
          `${highlightCell(new_value, old_value, props.data?.change_type)}`,
          // 'grid grid-cols-2 grid-rows-2 gap-x-1 leading-normal',
        )}
        component="span"
      >
        <span className="whitespace-nowrap font-semibold">{new_value}</span>
        <span className="diff-old-value col-start-2 row-start-2 whitespace-nowrap">
          {old_value}
        </span>
      </Typography>
    </Tooltip>
  )
}
