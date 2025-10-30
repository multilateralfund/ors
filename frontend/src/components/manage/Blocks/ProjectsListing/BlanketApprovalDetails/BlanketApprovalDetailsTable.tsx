import {
  GlobalRequestParams,
  RowData,
} from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/types.ts'
import React, { useCallback } from 'react'
import BlanketApprovalDetailsRow from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/BlanketApprovalDetailsRow.tsx'

const BlanketApprovalDetailsTable = (props: {
  rows: RowData[]
  setRows: React.Dispatch<React.SetStateAction<RowData[]>>
  globalRequestParams: GlobalRequestParams
}) => {
  const { rows, setRows, globalRequestParams } = props

  const setRow = useCallback(
    (idx: number) => (updater: RowData | ((prevRowData: RowData) => RowData)) =>
      setRows((prevState) => {
        const newRows = [...prevState]
        if (typeof updater === 'function') {
          newRows[idx] = updater(newRows[idx])
        } else {
          newRows[idx] = updater
        }
        return newRows
      }),
    [setRows],
  )

  return (
    <table className="table w-full border-collapse">
      <thead className="border border-2 border-x-0 border-solid border-primary">
        <tr>
          <th className="text-left">Project title</th>
          <th>Agency</th>
          <th>HCFC</th>
          <th>HFC</th>
          <th colSpan={3}>
            Funds {globalRequestParams.submission_status} (US $)
          </th>
        </tr>
        <tr>
          <th></th>
          <th></th>
          <th>(ODP tonnes)</th>
          <th>(CO2-eq '000 tonnes)</th>
          <th className="text-right">Project</th>
          <th className="text-right">Support</th>
          <th className="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          return (
            <BlanketApprovalDetailsRow
              key={i}
              rowIdx={i}
              rowData={row}
              setRow={setRow}
              globalRequestParams={globalRequestParams}
            />
          )
        })}
        {rows.length ? (
          <tr>
            <th></th>
            <th>Total for [country]</th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
          </tr>
        ) : null}
      </tbody>
    </table>
  )
}

export default BlanketApprovalDetailsTable
