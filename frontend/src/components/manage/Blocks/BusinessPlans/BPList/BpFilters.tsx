import {Box} from "@mui/material";

import Field from '@ors/components/manage/Form/Field'
import { debounce } from '@ors/helpers'

import { IoChevronDownCircle } from 'react-icons/io5'

const StatusFilter = (props: {
  filters: any
  setFilters: any
  statuses: any
}) => {
  const { filters, setFilters, statuses } = props

  // Map statuses to an array of objects with label and value
  const statusOptions = statuses.map((status: any) => ({
    label: status[1],
    value: status[0],
  }))

  return (
    <Field
      FieldProps={{ className: 'mb-0 w-full CPListing' }}
      options={statusOptions}
      popupIcon={<IoChevronDownCircle color="black" size={24} />}
      widget="autocomplete"
      Input={{
        placeholder: 'STATUS',
      }}
      getOptionLabel={(option: { label: string; value: string }) =>
        option.label
      }
      value={
        statusOptions.find((option: any) => option.value === filters.status) ||
        null
      }
      onChange={(_: any, value: any) => {
        debounce(() => {
          setFilters({ ...filters, status: value ? value.value : null })
        })
      }}
    />
  )
}

const YearSelect = (props: {
  filters: any
  setFilters: any
  yearRanges: any
}) => {
  const { filters, setFilters, yearRanges } = props

  // Extract start and end years as separate lists
  const startYearOptions = yearRanges.map((range: any) => range.year_start)
  const endYearOptions = yearRanges.map((range: any) => range.year_end)

  return (
    <div className="flex gap-4">
      <Field
        FieldProps={{ className: 'mb-0 w-full CPListing' }}
        getOptionLabel={(option: number) => option.toString()}
        options={startYearOptions}
        popupIcon={<IoChevronDownCircle color="black" size={24} />}
        value={filters.year_start}
        widget="autocomplete"
        Input={{
          placeholder: 'Start Year',
        }}
        onChange={(_: any, value: any) => {
          debounce(() => {
            setFilters({ ...filters, year_start: value || null })
          })
        }}
      />
      <Field
        FieldProps={{ className: 'mb-0 w-full CPListing' }}
        getOptionLabel={(option: number) => option.toString()}
        options={endYearOptions}
        popupIcon={<IoChevronDownCircle color="black" size={24} />}
        value={filters.year_end}
        widget="autocomplete"
        Input={{
          placeholder: 'End Year',
        }}
        onChange={(_: any, value: any) => {
          debounce(() => {
            setFilters({ ...filters, year_end: value || null })
          })
        }}
      />
    </div>
  )
}

const AgencyFilter = (props: {
  agencies: any
  filters: any
  setFilters: any
}) => {
  const { agencies, filters, setFilters } = props

  const agencyOptions = agencies.map((agency: any) => ({
    id: agency.id,
    label: agency.name,
  }))

  return (
    <Field
      FieldProps={{ className: 'mb-0 w-full CPListing' }}
      getOptionLabel={(option: { id: number; label: string }) => option.label}
      options={agencyOptions}
      popupIcon={<IoChevronDownCircle color="black" size={24} />}
      widget="autocomplete"
      Input={{
        placeholder: 'AGENCY',
      }}
      value={
        agencyOptions.find((option: any) => option.id === filters.agency_id) ||
        null
      }
      onChange={(_: any, value: any) => {
        debounce(() => {
          setFilters({ ...filters, agency_id: value ? value.id : null })
        })
      }}
    />
  )
}

function BPFilters(props: any) {
  const { agencies, filters, setFilters, statuses, yearRanges } = props

  return (
    <Box id="filters" className="flex h-fit gap-6 bg-transparent">
      <StatusFilter
        filters={filters}
        setFilters={setFilters}
        statuses={statuses}
      />
      <AgencyFilter
        agencies={agencies}
        filters={filters}
        setFilters={setFilters}
      />
      <YearSelect
        filters={filters}
        setFilters={setFilters}
        yearRanges={yearRanges}
      />
    </Box>
  )
}

export { BPFilters }
