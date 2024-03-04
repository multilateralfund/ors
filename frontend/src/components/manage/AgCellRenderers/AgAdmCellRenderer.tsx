'use client'
import { CustomCellRendererProps } from 'ag-grid-react'
import { find, includes } from 'lodash'

import AgSkeletonCellRenderer from '@ors/components/manage/AgCellRenderers/AgSkeletonCellRenderer'

import AgCellRenderer from './AgCellRenderer'

export function AgAdmCellRenderer(props: CustomCellRendererProps) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  let value = null
  const columnId = props?.colDef?.id
  const values = props.data.values || []

  if (includes(['group', 'hashed'], props.data.rowType)) {
    value = null
  } else {
    value = find(values, (value) => value.column_id === columnId)?.value_text
  }

  return (
    <AgCellRenderer
      {...props}
      colDef={{ ...props.colDef, category: undefined }}
      value={value}
    />
  )
}
