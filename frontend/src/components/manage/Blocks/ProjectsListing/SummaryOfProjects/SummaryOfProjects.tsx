import { Box, Button, Divider } from '@mui/material'
import { formatApiUrl, formatDecimalValue } from '@ors/helpers'
import React, { useCallback, useMemo, useState } from 'react'
import Link from '@ors/components/ui/Link/Link.tsx'
import SummaryOfProjectsFilters from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/SummaryOfProjectsFilters.tsx'
import {
  GlobalRequestParams,
  RowData,
} from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/types.ts'
import {
  initialGlobalRequestParams,
  initialRowData,
} from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/initialData.ts'
import SummaryOfProjectsRow from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/SummaryOfProjectsRow.tsx'
import { default as TableCell } from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/SummaryOfProjectsTableCell.tsx'
import { filterByValue } from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/utils.ts'

const SummaryOfProjectsTable = (props: {
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
    <div className="table w-full border-collapse">
      <div className="table-header-group font-bold">
        <div className="table-row">
          <TableCell>Projects and activities</TableCell>
          <TableCell>Context by row</TableCell>
          <TableCell>No. of countries</TableCell>
          <TableCell>No. of funding requests</TableCell>
          <TableCell>
            Amounts recommended <br />
            (US $)
          </TableCell>
          <TableCell>
            Amounts in principle <br />
            (US $)
          </TableCell>
        </div>
      </div>
      {rows.map((row, i) => {
        return (
          <SummaryOfProjectsRow
            key={i}
            rowIdx={i}
            rowData={row}
            setRow={setRow}
            globalRequestParams={globalRequestParams}
          />
        )
      })}
      {rows.length ? (
        <div className="table-row">
          <TableCell>Total</TableCell>
          <TableCell></TableCell>
          <TableCell></TableCell>
          <TableCell>
            {rows
              .map((r) => r.apiData?.projects_count ?? 0)
              .reduce((acc, v) => acc + v, 0)}
          </TableCell>
          <TableCell>
            {formatDecimalValue(
              rows
                .map((r) => r.apiData?.amounts_recommended ?? 0)
                .reduce((acc, v) => acc + v, 0),
            )}
          </TableCell>
          <TableCell></TableCell>
        </div>
      ) : null}
    </div>
  )
}

const SummaryOfProjects = () => {
  const [globalRequestParams, setGlobalRequestParams] =
    useState<GlobalRequestParams>(initialGlobalRequestParams())
  const [rows, setRows] = useState<RowData[]>([initialRowData()])
  const addRow = () => {
    setRows((prevState) => [...prevState, initialRowData()])
  }
  const removeRow = () => {
    setRows((prevState) => prevState.slice(0, prevState.length - 1))
  }

  const downloadUrl = useMemo(() => {
    const validRowData = rows.map((row) => {
      return {
        ...row,
        params: filterByValue({ ...globalRequestParams, ...row.params }),
      }
    })
    const b64rowData = btoa(JSON.stringify(validRowData))
    const encodedParams = new URLSearchParams({
      row_data: b64rowData,
    }).toString()
    return formatApiUrl(`api/summary-of-projects/export?${encodedParams}`)
  }, [rows, globalRequestParams])

  return (
    <>
      <Box className="shadow-none">
        <SummaryOfProjectsFilters
          requestParams={globalRequestParams}
          setRequestParams={setGlobalRequestParams}
        />
        <Divider className="my-2 border-0" />
        <SummaryOfProjectsTable
          globalRequestParams={globalRequestParams}
          rows={rows}
          setRows={setRows}
        />
        <div className="mt-4 flex gap-x-2">
          <Button size="large" variant="contained" onClick={addRow}>
            Add row
          </Button>
          <Button
            size="large"
            variant="contained"
            onClick={removeRow}
            disabled={rows.length === 0}
          >
            Remove row
          </Button>
          <Link button size="large" href={downloadUrl} variant="contained">
            Download summary
          </Link>
        </div>
      </Box>
    </>
  )
}

export default SummaryOfProjects
