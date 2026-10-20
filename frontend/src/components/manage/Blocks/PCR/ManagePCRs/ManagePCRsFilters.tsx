import Field from '@ors/components/manage/Form/Field'
import { SearchFilter } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { getFilterOptions } from '@ors/components/manage/Utils/utilFunctions'
import { pcrFieldsMapping } from '../constants'
import { PCRFiltersProps } from '../interfaces'

import { IoChevronDown } from 'react-icons/io5'
import { union } from 'lodash'

const ManagePCRsFilters = ({
  form,
  filters,
  fieldToOptionsMapping,
  handleFilterChange,
  handleParamsChange,
}: PCRFiltersProps) => {
  const defaultProps = {
    multiple: true,
    value: [],
    getOptionLabel: (option: any) => option?.name,
    popupIcon: <IoChevronDown size="18" color="#2F2F38" />,
    FieldProps: { className: 'mb-0 w-[8.5rem] BPList' },
    componentsProps: {
      popupIndicator: { sx: { transform: 'none !important' } },
    },
  }

  const FieldFilter = ({ field }: { field: string }) => {
    const filterField = field === 'category' ? field : field + '_id'

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
        {...defaultProps}
      />
    )
  }

  return (
    <div className="flex h-full flex-wrap items-center gap-2">
      <form ref={form} onSubmit={(e) => e.preventDefault()}>
        <SearchFilter
          placeholder="Search by keyword..."
          {...{ form, filters, handleFilterChange, handleParamsChange }}
        />
      </form>
      <FieldFilter field="country" />
      <FieldFilter field="lead_agency" />
    </div>
  )
}

export default ManagePCRsFilters
