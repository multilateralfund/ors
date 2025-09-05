'use client'

import { useContext } from 'react'

import Field from '@ors/components/manage/Form/Field'
import { getFilterOptions } from '@ors/components/manage/Utils/utilFunctions'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { tableColumns } from '../../constants'

import { IoChevronDown } from 'react-icons/io5'
import { useParams } from 'wouter'
import { union } from 'lodash'

const PEnterprisesFilters = ({
  enterpriseStatuses,
  commonSlice,
  filters,
  handleFilterChange,
  handleParamsChange,
}: any) => {
  const { project_id } = useParams<Record<string, string>>()
  const { canViewProjects } = useContext(PermissionsContext)

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

  return (
    <div className="grid h-full grid-cols-2 flex-wrap items-center gap-x-2 gap-y-2 border-0 border-solid md:flex">
      {/* {!project_id && canViewProjects && (
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
      )} */}
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

export default PEnterprisesFilters
