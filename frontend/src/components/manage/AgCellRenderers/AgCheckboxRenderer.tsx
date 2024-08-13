'use client'
import { CustomCellRendererProps } from 'ag-grid-react'
import { includes } from 'lodash'

import AgSkeletonCellRenderer from '@ors/components/manage/AgCellRenderers/AgSkeletonCellRenderer'

export default function AgCheckboxRenderer(
  props: { disabled: boolean } & CustomCellRendererProps,
) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  if (includes(['control', 'group', 'hashed'], props.data.rowType)) {
    return null
  }

  const onChange = (event: any) => {
    // @ts-ignore
    props.node.setDataValue(props.colDef.field, event.target.checked)
  }

  return (
    <input
      className="w-full"
      checked={props.value}
      disabled={props.disabled}
      type="checkbox"
      onChange={onChange}
    />
  )
}
