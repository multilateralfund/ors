'use client'
import React, { useState } from 'react'

import { Button, Skeleton, Typography } from '@mui/material'
import dynamic from 'next/dynamic'

import { getResults } from '@ors/helpers/Api/Api'
import useApi from '@ors/hooks/useApi'

const Table = dynamic(
  () => import('@ors/components/manage/Blocks/Table/Table'),
  {
    ssr: false,
  },
)

export default function ReportsTable() {
  const [apiSettings, setApiSettings] = useState({
    options: {
      params: {
        limit: 10,
        offset: 0,
      },
    },
    path: 'api/country-programme/reports/',
  })
  const { data, loading } = useApi(apiSettings)
  const { count, results } = getResults(data)

  // Each Column Definition results in one Column.
  const [columnDefs] = useState([
    {
      field: 'name',
      headerName: 'Report name',
    },
    { field: 'country', headerName: 'Country' },
    { field: 'year', headerName: 'Period' },
    { field: 'status', headerName: 'Status' },
    {
      cellClass: 'text-center',
      cellRenderer: (props: any) => {
        return (
          <Typography>
            {props.data.isSkeleton ? (
              <Skeleton />
            ) : (
              <Button variant="text">Edit</Button>
            )}
          </Typography>
        )
      },
      field: 'action',
      headerClass: 'text-center',
      headerName: 'Action',
      sortable: false,
    },
  ])

  function handleParamsChange(newParams: { [key: string]: any }) {
    setApiSettings((prevApiSettings) => ({
      ...prevApiSettings,
      options: {
        ...prevApiSettings.options,
        params: {
          ...prevApiSettings.options.params,
          ...newParams,
        },
      },
    }))
  }

  return (
    <Table
      columnDefs={columnDefs}
      loading={loading}
      rowCount={count}
      rowData={results}
      onPaginationChanged={({ page, rowsPerPage }) => {
        handleParamsChange({
          limit: rowsPerPage,
          offset: page * rowsPerPage,
        })
      }}
      withSkeleton
    />
  )
}
