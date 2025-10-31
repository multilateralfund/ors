import React, { useMemo } from 'react'
import {
  GlobalRequestParams,
  RowData,
} from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/types.ts'
import { default as TableCell } from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/BlanketApprovalDetailsTableCell.tsx'

type BlanketApprovalDetailsRowProps = {
  rowData: RowData
  setRowData: (updater: RowData | ((prevRowData: RowData) => RowData)) => void
  globalRequestParams: GlobalRequestParams
}

const BlanketApprovalDetailsRow = (props: BlanketApprovalDetailsRowProps) => {
  return (
    <tr>
      <td></td>
      <td></td>
      <td>(ODP tonnes)</td>
      <td>(CO2-eq '000 tonnes)</td>
      <td>Project</td>
      <td>Support</td>
      <td>Total</td>
    </tr>
  )
}
type BlanketApprovalDetailsRowWrapperProps = {
  rowIdx: number
  setRow: (idx: number) => BlanketApprovalDetailsRowProps['setRowData']
} & Omit<BlanketApprovalDetailsRowProps, 'setRowData'>

const BlanketApprovalDetailsRowWrapper = (
  props: BlanketApprovalDetailsRowWrapperProps,
) => {
  const { rowIdx, setRow, ...rest } = props

  const setRowData = useMemo(() => setRow(rowIdx), [setRow, rowIdx])

  return <BlanketApprovalDetailsRow {...rest} setRowData={setRowData} />
}

export default BlanketApprovalDetailsRowWrapper
