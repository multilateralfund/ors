'use client'
import React, { useRef, useState } from 'react'

import { Box, Grid } from '@mui/material'
import dynamic from 'next/dynamic'

import Field from '@ors/components/manage/Form/Field'
import { getResults } from '@ors/helpers/Api/Api'
import useApi from '@ors/hooks/useApi'
import useStore from '@ors/store'

import { columnSchema } from './schema'

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
  const grid = useRef<any>()
  const [apiSettings, setApiSettings] = useState({
    options: {
      params: {
        limit: 10,
        offset: 0,
        status_id: '',
        substance_type: '',
      },
    },
    path: 'api/projects',
  })
  const { data, loading } = useApi(apiSettings)
  const { count, results } = getResults(data)

  const projectStatuses = useStore((state) => state.projects.statuses.data)

  const [columnDefs] = useState(columnSchema)

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
    <Grid className="flex-col-reverse md:flex-row" spacing={2} container>
      <Grid md={8} sm={12} xl={10} item>
        <Table
          columnDefs={columnDefs}
          gridRef={grid}
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
      <Grid md={4} sm={12} xl={2} item>
        <Box className="rounded py-0">
          <h2>Filter projects by</h2>
          <Field
            options={projectStatuses}
            widget="chipToggle"
            onChange={(value: null | number) => {
              grid.current.api.paginationGoToPage(0)
              handleParamsChange({ offset: 0, status_id: value ?? '' })
            }}
          />
          <Field
            Input={{ label: 'Substance Type' }}
            defaultValue="Any"
            options={SUBSTANCE_TYPE_OPTIONS}
            widget="autocomplete"
            disableClearable
            onChange={(_: any, value: any) => {
              grid.current.api.paginationGoToPage(0)
              handleParamsChange({ offset: 0, substance_type: value.id })
            }}
          />
        </Box>
      </Grid>
    </Grid>
  )
}
