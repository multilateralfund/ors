'use client'

import Field from '@ors/components/manage/Form/Field'
import { getFilterOptions } from '@ors/components/manage/Utils/utilFunctions'
import { tableColumns } from '../../constants'

import { IoChevronDown } from 'react-icons/io5'
import { union } from 'lodash'

const EnterprisesFilters = ({
  enterpriseStatuses,
  commonSlice,
  filters,
  handleFilterChange,
  handleParamsChange,
}: any) => {
  const defaultProps = {
    multiple: true,
    value: [],
    getOptionLabel: (option: any) => option?.name,
    FieldProps: { className: 'mb-0 w-[8.5rem] BPList' },
    popupIcon: <IoChevronDown size="18" color="#2F2F38" />,
    componentsProps: {
      popupIndicator: {
        sx: {
          transform: 'none !important',
        },
      },
    },
  }

  return (
    <div className="flex h-full flex-wrap items-center gap-x-2 gap-y-2 border-0 border-solid">
      <Field
        Input={{ placeholder: tableColumns.country }}
        options={getFilterOptions(
          filters,
          commonSlice.countries.data,
          'country_id',
        )}
        widget="autocomplete"
        onChange={(_: any, value: any) => {
          const country = filters.country_id || []
          const newValue = union(country, value)

          handleFilterChange({ country_id: newValue })
          handleParamsChange({
            country_id: newValue.map((item: any) => item.id).join(','),
            offset: 0,
          })
        }}
        {...defaultProps}
      />
      <Field
        Input={{ placeholder: 'Status' }}
        options={getFilterOptions(filters, enterpriseStatuses, 'status')}
        widget="autocomplete"
        onChange={(_: any, value: any) => {
          const status = filters.status || []
          const newValue = union(status, value)

          handleFilterChange({ status: newValue })
          handleParamsChange({
            status: newValue.map((item: any) => item.id).join(','),
            offset: 0,
          })
        }}
        {...defaultProps}
      />
    </div>
  )
}

export default EnterprisesFilters
