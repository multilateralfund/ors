'use client'

import React from 'react'

import { Box, Grid } from '@mui/material'
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid'

import Field from '@ors/components/manage/Form/Field'
import useApi from '@ors/hooks/useApi'

import { IoPencil } from '@react-icons/all-files/io5/IoPencil'

const COLUMNS = [
  {
    field: 'title',
    flex: 2,
    headerName: 'Project title/code',
    sortable: false,
  },
  { field: 'country', flex: 1, headerName: 'Country', sortable: false },
  { field: 'agency', flex: 1, headerName: 'Agency', sortable: false },
  { field: 'status', flex: 1, headerName: 'Status', sortable: false },
  { field: 'sector', flex: 1, headerName: 'Sector', sortable: false },
  { field: 'subsector', flex: 1, headerName: 'Subsector', sortable: false },
  {
    field: 'project_type',
    flex: 1,
    headerName: 'Project Type',
    sortable: false,
  },
  {
    field: 'substance_type',
    flex: 1,
    headerName: 'Substance Type',
    sortable: false,
  },
  {
    field: 'approval_meeting_no',
    flex: 1,
    headerName: 'Approval meeting',
    sortable: false,
  },
  {
    field: 'actions',
    getActions: () => [
      <GridActionsCellItem
        key="edit"
        icon={<IoPencil />}
        label="Edit"
        onClick={() => {}}
      />,
    ],
    sortable: false,
    type: 'actions',
    width: 50,
  },
]

const SUBSTANCE_TYPE_OPTIONS = [
  { id: '', label: 'Any' },
  { id: 'HFC', label: 'HFC' },
  { id: 'HCFC', label: 'HCFC' },
  { id: 'HFC_Plus', label: 'HFC_Plus' },
]

export default function ProjectsTable() {
  const [params, setParams] = React.useState({
    page: 1,
    pageSize: 10,
    substanceTypeFilter: '',
  })
  const options = React.useMemo(() => {
    return {
      params: {
        limit: params.pageSize,
        offset: (params.page - 1) * params.pageSize,
        substance_type: params.substanceTypeFilter,
      },
    }
  }, [params.pageSize, params.page, params.substanceTypeFilter])

  const [data, , loading] = useApi({
    options,
    path: '/api/projects/',
  })

  return (
    <Grid spacing={2} container>
      <Grid xs={9} item>
        <Box className="rounded p-0">
          <DataGrid
            columns={COLUMNS}
            loading={loading}
            pageSizeOptions={[10, 20, 30, 40, 50]}
            paginationMode="server"
            paginationModel={params}
            rowCount={data?.count ?? 0}
            rows={data?.results ?? []}
            disableColumnFilter
            disableColumnMenu
            disableColumnSelector
            disableRowSelectionOnClick
            onPaginationModelChange={(value) =>
              setParams({ ...params, ...value })
            }
          />
        </Box>
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
              setParams({ ...params, substanceTypeFilter: value.id })
            }}
          />
        </Box>
      </Grid>
    </Grid>
  )
}
