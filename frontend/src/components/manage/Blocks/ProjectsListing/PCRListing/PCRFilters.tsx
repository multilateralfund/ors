import Field from '@ors/components/manage/Form/Field'
import { getFilterOptions } from '@ors/components/manage/Utils/utilFunctions'
import { SearchFilter } from '../HelperComponents'
import { pcrTableColumns } from './constants'
import { PCRFilterOptions, PCROption } from './types'
import DateRangePicker from '@ors/components/ui/DateRangePicker/DateRangePicker'

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

  const handleDateRangeChange = (start: string, end: string) => {
    handleFilterChange({
      submission_date_after: start,
      submission_date_before: end,
    })
    handleParamsChange({
      submission_date_after: start,
      submission_date_before: end,
      offset: 0,
    })
  }

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
      <DateRangePicker
        end={filters.submission_date_before || ''}
        label="Submission date"
        start={filters.submission_date_after || ''}
        onChange={handleDateRangeChange}
      />
    </div>
  )
}

export default PCRFilters
