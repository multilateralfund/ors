import { Fragment } from 'react'

import Field from '@ors/components/manage/Form/Field'
import { SearchFilter } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { getFilterOptions } from '@ors/components/manage/Utils/utilFunctions'
import { pcrFieldsMapping } from '../constants'
import { ProjectStatusType } from '@ors/types/api_project_statuses'

import { Checkbox, FormControlLabel, Paper, Divider } from '@mui/material'
import { IoChevronDown } from 'react-icons/io5'
import { map, union } from 'lodash'

const PCRFilters = ({
  form,
  filterOptions = {},
  statusFilterOpts,
  filters,
  handleFilterChange,
  handleParamsChange,
}: any) => {
  const booleanFieldsFilters = ['pcr_due', 'ad_hoc_pcr', 'pcr_submitted']

  const getDefaultProps = (field: string) => {
    const filterWidth = ['cooperating_agency'].includes(field)
      ? 'w-[11rem]'
      : 'w-[8.5rem]'

    return {
      multiple: true,
      value: [],
      getOptionLabel: (option: any) => option?.name,
      FieldProps: { className: `mb-0 ${filterWidth} BPList` },
      popupIcon: <IoChevronDown size="18" color="#2F2F38" />,
      componentsProps: {
        popupIndicator: { sx: { transform: 'none !important' } },
      },
    }
  }

  const FieldFilter = ({ field }: { field: string }) => {
    const filterField = field + '_id'

    return (
      <Field
        Input={{ placeholder: pcrFieldsMapping[field] }}
        options={getFilterOptions(filters, filterOptions?.[field], filterField)}
        widget="autocomplete"
        onChange={(_, value) => {
          const filtervalue = filters[filterField] || []
          const newValue = union(filtervalue, value)

          handleFilterChange({ [filterField]: newValue })
          handleParamsChange({
            [filterField]: newValue.map((item: any) => item.id).join(','),
            offset: 0,
          })
        }}
        {...getDefaultProps(field)}
      />
    )
  }

  const statusFilter = (
    <Paper component="ul" className="m-0 flex list-none gap-x-2 px-2">
      {statusFilterOpts.map((status: ProjectStatusType) => (
        <Fragment key={status.name}>
          <li>
            <FormControlLabel
              className="m-0"
              control={
                <Checkbox
                  size="small"
                  checked={map(filters.status, 'code').includes(status.code)}
                />
              }
              label={`${status.code} projects`}
              onChange={(_, checked) => {
                const statusFilters = checked
                  ? union(filters.status, [status])
                  : filters.status.filter(
                      (f: ProjectStatusType) => f.code !== status.code,
                    )

                handleFilterChange({ status: statusFilters })
                handleParamsChange({
                  status: statusFilters.map((item: any) => item.code).join(','),
                  offset: 0,
                })
              }}
            />
          </li>
          <li>
            <Divider orientation="vertical" />
          </li>
        </Fragment>
      ))}
      {booleanFieldsFilters.map((field: string, index: number) => (
        <Fragment key={field}>
          <li>
            <FormControlLabel
              className="m-0"
              control={<Checkbox size="small" checked={filters[field]} />}
              label={pcrFieldsMapping[field]}
              onChange={(_, checked) => {
                handleFilterChange({ [field]: checked })
                handleParamsChange({
                  [field]: checked,
                  offset: 0,
                })
              }}
            />
          </li>
          {index !== booleanFieldsFilters.length - 1 && (
            <li>
              <Divider orientation="vertical" />
            </li>
          )}
        </Fragment>
      ))}
    </Paper>
  )

  return (
    <div className="flex h-full flex-wrap items-center gap-2">
      <form ref={form} onSubmit={(e) => e.preventDefault()}>
        <SearchFilter
          placeholder="Search by keyword..."
          {...{ form, filters, handleFilterChange, handleParamsChange }}
        />
      </form>
      <FieldFilter field="region" />
      <FieldFilter field="country" />
      <FieldFilter field="lead_agency" />
      <FieldFilter field="cooperating_agency" />
      <FieldFilter field="cluster" />
      <FieldFilter field="project_type" />
      <FieldFilter field="sector" />
      <FieldFilter field="subsector" />
      <FieldFilter field="category" />
      <Field
        FieldProps={{ className: 'mb-0 BPList' }}
        buttonClassName="h-9 !pr-3.5 [font-family:var(--font-roboto-condensed)]"
        labelClassName="normal-case mt-0.5 text-[#111827]"
        label={pcrFieldsMapping.submission_date}
        max={new Date().getFullYear()}
        min={1990}
        value={filters.submission_date}
        widget="yearRange"
        onChange={(value) => {
          handleFilterChange({ submission_date: value })
          handleParamsChange({
            submission_date: value,
            offset: 0,
          })
        }}
      />

      {statusFilter}
    </div>
  )
}

export default PCRFilters
