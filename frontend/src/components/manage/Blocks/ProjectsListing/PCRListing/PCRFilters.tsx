import Field from '@ors/components/manage/Form/Field'
import { getFilterOptions } from '@ors/components/manage/Utils/utilFunctions'
import { SearchFilter } from '../HelperComponents'
import { pcrTableColumns } from './constants'
import { PCRFilterOptions, PCROption } from './types'

import { IoChevronDown } from 'react-icons/io5'
import { union } from 'lodash'

type PCRFiltersProps = {
  filterOptions?: PCRFilterOptions
  form: any
  filters: Record<string, any>
  handleFilterChange: (params: Record<string, any>) => void
  handleParamsChange: (params: Record<string, any>) => void
}

const PCRFilters = ({
  filterOptions = {},
  form,
  filters,
  handleFilterChange,
  handleParamsChange,
}: PCRFiltersProps) => {
  const defaultProps = {
    multiple: true,
    value: [],
    getOptionLabel: (option: any) => option?.name,
    FieldProps: { className: 'mb-0 w-full md:w-[8.5rem] BPList' },
    popupIcon: <IoChevronDown size="18" color="#2F2F38" />,
    componentsProps: {
      popupIndicator: {
        sx: {
          transform: 'none !important',
        },
      },
    },
  }

  const renderAutocomplete = (
    placeholder: string,
    options: PCROption[] | undefined,
    filterKey: string,
    className?: string,
  ) => (
    <Field
      Input={{ placeholder }}
      options={getFilterOptions(filters, options, filterKey)}
      widget="autocomplete"
      onChange={(_: any, value: any) => {
        const selected = (filters[filterKey] || []) as PCROption[]
        const newValue = union(selected, value) as PCROption[]

        handleFilterChange({ [filterKey]: newValue })
        handleParamsChange({
          [filterKey]: newValue.map((item: PCROption) => item.id).join(','),
          offset: 0,
        })
      }}
      {...defaultProps}
      FieldProps={{
        className: className || defaultProps.FieldProps.className,
      }}
    />
  )

  const renderDateFilter = (
    label: string,
    filterKey: 'submission_date_after' | 'submission_date_before',
  ) => (
    <label className="flex h-9 w-full items-center gap-1 rounded border-2 border-solid border-primary bg-white px-2 text-base md:w-[10.5rem]">
      <span className="whitespace-nowrap text-gray-500">{label}</span>
      <input
        className="min-w-0 flex-1 border-0 bg-transparent text-base outline-none"
        type="date"
        value={filters[filterKey] || ''}
        onChange={(event) => {
          const value = event.target.value

          handleFilterChange({ [filterKey]: value })
          handleParamsChange({
            [filterKey]: value,
            offset: 0,
          })
        }}
      />
    </label>
  )

  return (
    <div className="grid h-full grid-cols-2 flex-wrap items-center gap-x-2 gap-y-2 border-0 border-solid md:flex">
      <SearchFilter
        placeholder="Search by keyword/metacode..."
        {...{ form, filters, handleFilterChange, handleParamsChange }}
      />
      {renderAutocomplete(
        'Region',
        filterOptions?.region,
        'region_id',
      )}
      {renderAutocomplete(
        pcrTableColumns.country,
        filterOptions?.country,
        'country_id',
      )}
      {renderAutocomplete(
        pcrTableColumns.lead_agency,
        filterOptions?.lead_agency,
        'lead_agency_id',
        'mb-0 w-full md:w-[10rem] BPList',
      )}
      {renderAutocomplete(
        pcrTableColumns.cooperating_agency,
        filterOptions?.cooperating_agency,
        'cooperating_agency_id',
        'mb-0 w-full md:w-[12.5rem] BPList',
      )}
      {renderAutocomplete(
        pcrTableColumns.cluster,
        filterOptions?.cluster,
        'cluster_id',
      )}
      {renderAutocomplete(
        pcrTableColumns.type,
        filterOptions?.project_type,
        'project_type_id',
      )}
      {renderAutocomplete(
        pcrTableColumns.sector,
        filterOptions?.sector,
        'sector_id',
      )}
      {renderAutocomplete(
        pcrTableColumns.subsector,
        filterOptions?.subsector,
        'subsector_id',
        'mb-0 w-full md:w-[9.5rem] BPList',
      )}
      {renderAutocomplete(
        pcrTableColumns.category,
        filterOptions?.category,
        'category',
      )}
      {renderAutocomplete(
        pcrTableColumns.pcr_due,
        filterOptions?.pcr_due,
        'pcr_due',
        'mb-0 w-full md:w-[8rem] BPList',
      )}
      {renderDateFilter('From', 'submission_date_after')}
      {renderDateFilter('To', 'submission_date_before')}
    </div>
  )
}

export default PCRFilters
