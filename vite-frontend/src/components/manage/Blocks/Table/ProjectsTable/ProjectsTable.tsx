// @ts-nocheck
'use client'
import React, { useRef, useState } from 'react'

import { Box, Grid } from '@mui/material'
import dynamic from 'next/dynamic'

import Field from '@ors/components/manage/Form/Field'
import { getResults } from '@ors/helpers/Api/Api'
import useApi from '@ors/hooks/useApi'
import { useStore } from '@ors/store'

import { columnSchema } from './schema'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function ProjectsTable() {
  const grid = useRef<any>()
  const [apiSettings, setApiSettings] = useState({
    options: {
      params: {
        agency_id: null,
        approval_meeting_no: null,
        limit: 10,
        offset: 0,
        project_type_id: null,
        sector_id: null,
        status_id: null,
        subsector_id: null,
        substance_type: null,
      },
    },
    path: 'api/projects/',
  })
  const { data, loading } = useApi(apiSettings)
  const { count, results } = getResults(data)

  const commonSlice = useStore((state) => state.common)
  const projectSlice = useStore((state) => state.projects)
  const substanceTypes = commonSlice.settings.data.project_substance_types.map(
    (obj: Array<string>) => ({ id: obj[0], label: obj[1] }),
  )

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
      <Grid md={8} sm={12} xl={9} item>
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
      <Grid md={4} sm={12} xl={3} item>
        <Box className="rounded py-0">
          <h2>Filter projects by</h2>
          <Field
            options={projectSlice.statuses.data}
            widget="chipToggle"
            onChange={(value: null | number) => {
              grid.current.paginationGoToPage(0)
              handleParamsChange({ offset: 0, status_id: value })
            }}
          />
          <Field
            Input={{ label: 'Sector' }}
            getOptionLabel={(option: any) => option?.name}
            options={projectSlice.sectors.data}
            widget="autocomplete"
            onChange={(_: any, value: any) => {
              grid.current.paginationGoToPage(0)
              handleParamsChange({ offset: 0, sector_id: value?.id })
            }}
          />
          <Field
            Input={{ label: 'Subsector' }}
            getOptionLabel={(option: any) => option?.name}
            options={projectSlice.subsectors.data}
            widget="autocomplete"
            onChange={(_: any, value: any) => {
              grid.current.paginationGoToPage(0)
              handleParamsChange({ offset: 0, subsector_id: value?.id })
            }}
          />
          <Field
            Input={{ label: 'Type' }}
            getOptionLabel={(option: any) => option?.name}
            options={projectSlice.types.data}
            widget="autocomplete"
            onChange={(_: any, value: any) => {
              grid.current.paginationGoToPage(0)
              handleParamsChange({ offset: 0, project_type_id: value?.id })
            }}
          />
          <Field
            Input={{ label: 'Substance Type' }}
            options={substanceTypes}
            widget="autocomplete"
            onChange={(_: any, value: any) => {
              grid.current.paginationGoToPage(0)
              handleParamsChange({ offset: 0, substance_type: value?.id })
            }}
          />
          <Field
            Input={{ label: 'Agency' }}
            getOptionLabel={(option: any) => option?.name}
            options={commonSlice.agencies.data}
            widget="autocomplete"
            onChange={(_: any, value: any) => {
              grid.current.paginationGoToPage(0)
              handleParamsChange({ agency_id: value?.id, offset: 0 })
            }}
          />
          <Field
            Input={{ label: 'Meeting' }}
            getOptionLabel={(option: any) => option.toString()}
            options={projectSlice.meetings.data}
            widget="autocomplete"
            onChange={(_: any, value: any) => {
              grid.current.paginationGoToPage(0)
              handleParamsChange({ approval_meeting_no: value, offset: 0 })
            }}
          />
        </Box>
      </Grid>
    </Grid>
  )
}
