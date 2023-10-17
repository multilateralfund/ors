'use client'
import { Typography } from '@mui/material'

import AgSkeletonCellRenderer from '@ors/components/manage/AgCellRenderers/AgSkeletonCellRenderer'
import AgTooltipComponent from '@ors/components/manage/AgComponents/AgTooltipComponent'

export default function AgTextCellRenderer(props: any) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  return (
    <AgTooltipComponent {...props}>
      <Typography className={props.className} component="span" lineHeight={1}>
        {props.value}
      </Typography>
    </AgTooltipComponent>
  )
}
