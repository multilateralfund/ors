'use client'
import React, { useRef, useState } from 'react'

import { Box, Typography } from '@mui/material'
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

export default function ReportsTable() {
  const grid = useRef<any>()
  const [apiSettings, setApiSettings] = useState<{
    options: { params: Record<string, any> }
    path: string
  }>({
    options: {
      params: {
        limit: 10,
        offset: 0,
      },
    },
    path: 'api/country-programme/reports/',
  })
  const countries = useStore((state) => [
    { id: 0, label: 'Any' },
    ...getResults(state.common.countries.data).results.map((country) => ({
      id: country.id,
      label: country.name,
    })),
  ])
  const { data, loading } = useApi(apiSettings)
  const { count, results } = getResults(data)

  // Each Column Definition results in one Column.
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
    <>
      <Box className="rounded-b-none border-b-0">
        <Typography className="mb-4">All submissions</Typography>
        <div className="grid grid-cols-3 gap-x-4">
          <Field
            Input={{ label: 'Party' }}
            defaultValue="Any"
            options={countries}
            widget="autocomplete"
            onChange={(_: any, value: any) => {
              const newParams = apiSettings.options.params
              if (!value?.id) {
                delete newParams.country_id
              } else {
                newParams.country_id = value.id
              }
              grid.current.api.paginationGoToPage(0)
              handleParamsChange({ ...newParams, offset: 0 })
            }}
          />
          {/* <Field Input={{ label: 'Status' }} widget="autocomplete" />
          <Field Input={{ label: 'Status' }} widget="autocomplete" />
          <Field Input={{ label: 'From' }} widget="autocomplete" />
          <Field Input={{ label: 'To' }} widget="autocomplete" /> */}
        </div>
      </Box>
      <Table
        className="rounded-t-none"
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
    </>
  )
}
