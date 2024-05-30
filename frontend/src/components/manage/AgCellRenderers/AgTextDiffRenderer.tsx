'use client'

import { Typography } from '@mui/material'
import { CustomCellRendererProps } from 'ag-grid-react'
import cx from 'classnames'

import AgSkeletonCellRenderer from '@ors/components/manage/AgCellRenderers/AgSkeletonCellRenderer'
import AgTooltipDiffComponent from '@ors/components/manage/AgComponents/AgTooltipDiffComponent'
import {
  highlightCell,
  truncateText,
} from '@ors/components/manage/Utils/diffUtils'

export default function AgTextDiffRenderer(props: CustomCellRendererProps) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  const remarks = props.column?.getColId() === 'remarks' &&
    props.value && {
      newRemarks: props.value,
      oldRemarks: props.data.remarks_old,
    }

  const textValue = remarks ? truncateText(props.value, 30) : props.value

  return (
    <AgTooltipDiffComponent {...props} remarks={remarks}>
      <Typography
        className={cx(
          "p-2",
          props.className,
          remarks &&
            highlightCell(
              remarks.newRemarks,
              remarks.oldRemarks,
              props.data?.change_type,
            ),
        )}
        component="span"
      >
        {textValue}
      </Typography>
    </AgTooltipDiffComponent>
  )
}
