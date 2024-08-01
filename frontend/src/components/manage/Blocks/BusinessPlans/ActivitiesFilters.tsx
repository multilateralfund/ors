import React from 'react'

import {
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton as MuiIconButton,
  Typography,
} from '@mui/material'

import Field from '@ors/components/manage/Form/Field'
import { KEY_ENTER } from '@ors/constants'

import { IoClose, IoSearchOutline } from 'react-icons/io5'

export default function ActivitiesFilters(props: any) {
  const {
    bpSlice,
    clusters,
    commonSlice,
    filters,
    form,
    handleFilterChange,
    handleParamsChange,
    withAgency = false,
  } = props

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Search Input */}
      <div className="flex items-center gap-2 lg:items-start lg:flex-col">
        <Field
          name="search"
          FieldProps={{ className: 'mb-0 w-80 lg:w-60 BPList' }}
          placeholder="Search by keyword..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MuiIconButton
                  aria-label="search table"
                  edge="start"
                  tabIndex={-1}
                  onClick={() => {
                    const search = form.current.search.value
                    handleParamsChange({
                      offset: 0,
                      search,
                    })
                    handleFilterChange({ search })
                  }}
                  disableRipple
                >
                  <IoSearchOutline />
                </MuiIconButton>
              </InputAdornment>
            ),
          }}
          onKeyDown={(event: any) => {
            const search = form.current.search.value
            if (event.key === KEY_ENTER) {
              handleParamsChange({
                offset: 0,
                search,
              })
              handleFilterChange({ search })
            }
          }}
        />
        {!!filters.search && (
          <Typography className="inline-flex items-center gap-2 rounded-sm border border-solid border-mui-default-border bg-action-highlight px-2 py-1 italic text-typography-secondary">
            {filters.search}
            <IoClose
              className="cursor-pointer rounded-sm"
              onClick={() => {
                form.current.search.value = ''
                handleParamsChange({ offset: 0, search: '' })
                handleFilterChange({ search: '' })
              }}
            />
          </Typography>
        )}
      </div>
      {/* Rest of filters */}
      <div className="flex h-full flex-wrap items-center gap-x-4 gap-y-2 border-0 border-solid border-gray-200 lg:border-l lg:pl-4">
        <Field
          FieldProps={{ className: 'mb-0 w-40 BPList' }}
          Input={{ label: 'Country' }}
          getOptionLabel={(option: any) => option?.name}
          options={commonSlice.countries.data}
          value={filters.country_id}
          widget="autocomplete"
          onChange={(_: any, value: any) => {
            handleFilterChange({ country_id: value })
            handleParamsChange({
              country_id: value.map((item: any) => item.id).join(','),
              offset: 0,
            })
          }}
          multiple
        />
        {withAgency && (
          <Field
            FieldProps={{ className: 'mb-0 w-40 BPList' }}
            Input={{ label: 'Agency' }}
            getOptionLabel={(option: any) => option?.name}
            options={commonSlice.agencies.data}
            value={filters.agency_id}
            widget="autocomplete"
            onChange={(_: any, value: any) => {
              handleFilterChange({ agency_id: value })
              handleParamsChange({
                agency_id: value.map((item: any) => item.id).join(','),
                offset: 0,
              })
            }}
            multiple
          />
        )}
        <Field
          FieldProps={{ className: 'mb-0 w-40 BPList' }}
          Input={{ label: 'Cluster' }}
          getOptionLabel={(option: any) => option?.name}
          options={clusters}
          value={filters.project_cluster_id}
          widget="autocomplete"
          onChange={(_: any, value: any) => {
            handleFilterChange({ project_cluster_id: value })
            handleParamsChange({
              offset: 0,
              project_cluster_id: value.map((item: any) => item.id).join(','),
            })
          }}
          multiple
        />
        <Field
          FieldProps={{ className: 'mb-0 w-40 BPList' }}
          Input={{ label: 'Sector' }}
          getOptionLabel={(option: any) => option?.name}
          options={bpSlice.sectors.data}
          value={filters.sector_id}
          widget="autocomplete"
          onChange={(_: any, value: any) => {
            handleFilterChange({ sector_id: value })
            handleParamsChange({
              offset: 0,
              sector_id: value.map((item: any) => item.id).join(','),
            })
          }}
          multiple
        />
        <Field
          FieldProps={{ className: 'mb-0 w-40 BPList' }}
          Input={{ label: 'Subsector' }}
          getOptionLabel={(option: any) => option?.name}
          options={bpSlice.subsectors.data}
          value={filters.subsector_id}
          widget="autocomplete"
          onChange={(_: any, value: any) => {
            handleFilterChange({ subsector_id: value })
            handleParamsChange({
              offset: 0,
              subsector_id: value.map((item: any) => item.id).join(','),
            })
          }}
          multiple
        />
        <Field
          FieldProps={{ className: 'mb-0 w-40 BPList' }}
          Input={{ label: 'Type' }}
          getOptionLabel={(option: any) => option?.name}
          options={bpSlice.types.data}
          value={filters.project_type_id}
          widget="autocomplete"
          isOptionEqualToValue={(option: any, value: any) =>
            option.id === value
          }
          onChange={(_: any, value: any) => {
            handleFilterChange({ project_type_id: value })
            handleParamsChange({
              offset: 0,
              project_type_id: value.map((item: any) => item.id).join(','),
            })
          }}
          multiple
        />
        <FormControlLabel
          className="BPList !m-0"
          label="Multi-Year"
          control={
            <Checkbox
              checked={filters.is_multi_year}
              onChange={(event) => {
                handleFilterChange({
                  is_multi_year: event.target.checked,
                })
                handleParamsChange({
                  is_multi_year: event.target.checked,
                  offset: 0,
                })
              }}
            />
          }
        />
      </div>
    </div>
  )
}
