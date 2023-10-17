'use client'
import { Typography } from '@mui/material'
import { includes, isBoolean, isString } from 'lodash'

import AgSkeletonCellRenderer from '@ors/components/manage/AgCellRenderers/AgSkeletonCellRenderer'
import AgTooltipComponent from '@ors/components/manage/AgComponents/AgTooltipComponent'

export default function AgBooleanCellRenderer(props: any) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  const { noText = 'No', value, yesText = 'Yes' } = props

  let formattedValue

  if (isBoolean(value)) {
    formattedValue = value ? yesText : noText
  }

  if (isString(value) && includes(['yes', 'Yes', 'true', 'True'], value)) {
    formattedValue = yesText
  }

  if (isString(value) && includes(['no', 'No', 'false', 'False'], value)) {
    formattedValue = noText
  }

  return (
    <AgTooltipComponent {...props} value={formattedValue}>
      <Typography className={props.className} component="span" lineHeight={1}>
        {formattedValue}
      </Typography>
    </AgTooltipComponent>
  )
}
