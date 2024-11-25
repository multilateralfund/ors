import React, { useRef, useState } from 'react'

import { Alert, Typography } from '@mui/material'

import Table from '@ors/components/manage/Form/Table'

import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

function getRowData(report: any) {
  return [...report.section_e]
}

export default function SectionEViewDiff(props: any) {
  const { TableProps, report, reportDiff } = props
  const gridOptions = useGridOptions()
  const grid = useRef<any>()
  const [rowData] = useState(() => getRowData(reportDiff))

  const isLatestVersion = !report.data?.final_version_id
  const version = report.data?.version

  return (
    <>
      {version && (
        <Alert
          className="bg-mlfs-bannerColor"
          icon={<IoInformationCircleOutline size={24} />}
          severity="info"
        >
          <Typography className="transition-all">
            The table below presents the data from
            <span className="font-semibold"> version {version} </span>
            {isLatestVersion && '(latest)'} on the upper rows and from
            <span className="font-semibold"> version {version - 1} </span>
            {isLatestVersion && '(previous)'} on the bottom rows.
          </Typography>
        </Alert>
      )}
      <Table
        {...TableProps}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
        headerDepth={2}
        rowData={rowData}
      />
    </>
  )
}
