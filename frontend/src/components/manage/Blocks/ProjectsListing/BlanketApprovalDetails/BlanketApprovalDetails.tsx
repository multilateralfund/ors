import React, { useMemo, useState } from 'react'
import {
  GlobalRequestParams,
  RowData,
} from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/types.ts'
import {
  initialGlobalRequestParams,
  initialRowData,
} from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/initialData.ts'
import { formatApiUrl } from '@ors/helpers'
import { Box, Button, Divider } from '@mui/material'
import SummaryOfProjectsFilters from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/SummaryOfProjectsFilters.tsx'
import Link from '@ors/components/ui/Link/Link.tsx'
import { filterByValue } from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/utils.ts'
import BlanketApprovalDetailsTable from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/BlanketApprovalDetailsTable.tsx'
import { AddEntryForm } from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/AddEntryForm.tsx'

const BlanketApprovalDetails = () => {
  const [globalRequestParams, setGlobalRequestParams] =
    useState<GlobalRequestParams>(initialGlobalRequestParams())
  const [rows, setRows] = useState<RowData[]>([])
  const addRow = (params: RowData['params']) => {
    setRows((prevState) => [
      ...prevState,
      { ...initialRowData(), params: params },
    ])
  }
  const removeRow = () => {
    setRows((prevState) => prevState.slice(0, prevState.length - 1))
  }

  const encodedRowData = useMemo(() => {
    const validRowData = rows.map((row) =>
      filterByValue({ ...globalRequestParams, ...row.params }),
    )
    console.log('downloadUrl', validRowData)
    return btoa(JSON.stringify(validRowData))
  }, [rows, globalRequestParams])

  const downloadUrl = useMemo(() => {
    const encodedParams = new URLSearchParams({
      row_data: encodedRowData,
    }).toString()
    return formatApiUrl(`api/blanket-approval-details/export?${encodedParams}`)
  }, [encodedRowData])

  return (
    <>
      <Box className="shadow-none">
        <div className="justify-between sm:flex-wrap md:flex">
          <SummaryOfProjectsFilters
            requestParams={globalRequestParams}
            setRequestParams={setGlobalRequestParams}
          />
          <Box className="shadow-none">
            <AddEntryForm
              addRow={addRow}
              globalRequestParams={globalRequestParams}
              rows={rows}
            />
          </Box>
        </div>
        <Divider className="my-2 border-0" />
        <BlanketApprovalDetailsTable
          globalRequestParams={globalRequestParams}
          encodedRowData={encodedRowData}
          rows={rows}
          setRows={setRows}
        />
        <div className="mt-4 flex gap-x-2">
          <Button
            size="large"
            variant="contained"
            onClick={removeRow}
            disabled={rows.length === 0}
          >
            Remove row
          </Button>
          <Link
            button
            disabled={!rows.length}
            size="large"
            href={downloadUrl}
            variant="contained"
          >
            Download summary
          </Link>
        </div>
      </Box>
    </>
  )
}

export default BlanketApprovalDetails
