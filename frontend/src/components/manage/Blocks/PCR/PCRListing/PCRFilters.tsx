import DateRangePicker from '@ors/components/ui/DateRangePicker/DateRangePicker'
import Field from '@ors/components/manage/Form/Field'
import { SearchFilter } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { getFilterOptions } from '@ors/components/manage/Utils/utilFunctions'
import { pcrFieldsMapping } from '../constants'
import { PCRFiltersProps } from '../interfaces'

import { IoChevronDown } from 'react-icons/io5'
import { union } from 'lodash'

const PCRFilters = ({
  form,
  filters,
  fieldToOptionsMapping,
  handleFilterChange,
  handleParamsChange,
}: PCRFiltersProps) => {
  const getDefaultProps = (field: string) => {
    const filterWidth =
      field === 'cooperating_agency' ? 'w-[11rem]' : 'w-[8.5rem]'

    return {
      multiple: true,
      value: [],
      getOptionLabel: (option: any) => option?.name,
      popupIcon: <IoChevronDown size="18" color="#2F2F38" />,
      FieldProps: { className: `mb-0 ${filterWidth} BPList` },
      componentsProps: {
        popupIndicator: { sx: { transform: 'none !important' } },
      },
    }
  }

  const FieldFilter = ({ field }: { field: string }) => {
    const simpleFields = [
      'subsectors',
      'category',
      'pcr_due',
      'ad_hoc_pcr',
      'pcr_submitted',
    ]

    const filterField = simpleFields.includes(field) ? field : field + '_id'

    return (
      <Field
        widget="autocomplete"
        Input={{ placeholder: pcrFieldsMapping[field] }}
        options={getFilterOptions(
          filters,
          fieldToOptionsMapping[field],
          filterField,
        )}
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

  const handleDateRangeChange = (start: string, end: string) => {
    handleFilterChange({
      pcr_submission_date_after: start,
      pcr_submission_date_before: end,
    })
    handleParamsChange({
      pcr_submission_date_after: start,
      pcr_submission_date_before: end,
      offset: 0,
    })
  }

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
      <FieldFilter field="subsectors" />
      <FieldFilter field="category" />
      <FieldFilter field="status" />
      <FieldFilter field="pcr_due" />
      <FieldFilter field="ad_hoc_pcr" />
      <FieldFilter field="pcr_submitted" />
      <DateRangePicker
        label="PCR submission date"
        start={filters.pcr_submission_date_after || ''}
        end={filters.pcr_submission_date_before || ''}
        onChange={handleDateRangeChange}
      />
    </div>
  )
}

export default PCRFilters
