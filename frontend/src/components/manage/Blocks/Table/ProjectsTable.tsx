'use client'
import React, { useState } from 'react'

import { Box, Button, Grid, Skeleton, Typography } from '@mui/material'
import dynamic from 'next/dynamic'

import Field from '@ors/components/manage/Form/Field'
import { getResults } from '@ors/helpers/Api/Api'
import useApi from '@ors/hooks/useApi'

const Table = dynamic(
  () => import('@ors/components/manage/Blocks/Table/Table'),
  {
    ssr: false,
  },
)

const SUBSTANCE_TYPE_OPTIONS = [
  { id: '', label: 'Any' },
  { id: 'HFC', label: 'HFC' },
  { id: 'HCFC', label: 'HCFC' },
  { id: 'HFC_Plus', label: 'HFC_Plus' },
]

export default function ReportsTable() {
  const [apiSettings, setApiSettings] = useState({
    options: {
      params: {
        limit: 10,
        offset: 0,
        substanceTypeFilter: '',
      },
    },
    path: 'api/projects',
  })
  const { data, loading } = useApi(apiSettings)
  const { count, results } = getResults(data)

  const [columnDefs] = useState([
    {
      field: 'title',
      flex: 2,
      headerName: 'Project title/code',
    },
    { field: 'country', flex: 1, headerName: 'Country' },
    { field: 'agency', flex: 1, headerName: 'Agency' },
    { field: 'status', flex: 1, headerName: 'Status' },
    { field: 'sector', flex: 1, headerName: 'Sector' },
    { field: 'subsector', flex: 1, headerName: 'Subsector' },
    {
      field: 'project_type',
      flex: 1,
      headerName: 'Project Type',
    },
    {
      field: 'substance_type',
      flex: 1,
      headerName: 'Substance Type',
    },
    {
      field: 'approval_meeting_no',
      flex: 1,
      headerName: 'Approval meeting',
    },
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
    <Grid spacing={2} container>
      <Grid xs={9} item>
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
      </Grid>
      <Grid xs={3} item>
        <Box className="rounded py-0">
          <h2>Filter projects by</h2>
          <Field
            Input={{ label: 'Substance Type' }}
            defaultValue="Any"
            options={SUBSTANCE_TYPE_OPTIONS}
            widget="autocomplete"
            disableClearable
            onChange={(_: any, value: any) => {
              handleParamsChange({ substanceTypeFilter: value.id })
            }}
          />
        </Box>
      </Grid>
    </Grid>
  )
}
