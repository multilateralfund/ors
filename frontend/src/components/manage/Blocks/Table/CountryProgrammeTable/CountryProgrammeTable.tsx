'use client'
import React, { useRef, useState } from 'react'

import { Box, Typography } from '@mui/material'
import dynamic from 'next/dynamic'

import Field from '@ors/components/manage/Form/Field'
import { getResults } from '@ors/helpers/Api'
import useApi from '@ors/hooks/useApi'
import useStore from '@ors/store'

import { columnSchema } from './schema'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function CountryProgrammeTable() {
  const grid = useRef<any>()
  const [apiSettings, setApiSettings] = useState<{
    options: { params: Record<string, any> }
    path: string
  }>({
    options: {
      params: {
        limit: 50,
        offset: 0,
        year: 2022,
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
            defaultValue={{ id: 0, label: 'Any' }}
            options={countries}
            widget="autocomplete"
            onChange={(_: any, value: any) => {
              const newParams = apiSettings.options.params
              if (!value?.id) {
                delete newParams.country_id
              } else {
                newParams.country_id = value.id
              }
              grid.current.paginationGoToPage(0)
              handleParamsChange({ ...newParams, offset: 0 })
            }}
          />
          <Field
            Input={{ label: 'Period' }}
            defaultValue={{ id: 1, label: 2022 }}
            widget="autocomplete"
            options={[
              { id: 1, label: 2022 },
              { id: 2, label: 2021 },
              { id: 3, label: 2020 },
              { id: 4, label: 2019 },
              { id: 5, label: 2018 },
            ]}
            onChange={(_: any, value: any) => {
              const newParams = apiSettings.options.params
              if (!value?.label) {
                delete newParams.year
              } else {
                newParams.year = value.label
              }
              grid.current.paginationGoToPage(0)
              handleParamsChange({ ...newParams, offset: 0 })
            }}
          />
        </div>
      </Box>
      <Table
        className="rounded-t-none"
        columnDefs={columnDefs}
        gridRef={grid}
        loading={loading}
        paginationPageSize={50}
        rowCount={count}
        rowData={results}
        onPaginationChanged={({ page, rowsPerPage }) => {
          handleParamsChange({
            limit: rowsPerPage,
            offset: page * rowsPerPage,
          })
        }}
        withSeparators
        withSkeleton
      />
    </>
  )
}
