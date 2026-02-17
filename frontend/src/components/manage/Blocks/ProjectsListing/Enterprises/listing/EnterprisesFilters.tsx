import { useContext } from 'react'

import Field from '@ors/components/manage/Form/Field'
import { getFilterOptions } from '@ors/components/manage/Utils/utilFunctions'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import { enterpriseFieldsMapping } from '../../ProjectsEnterprises/constants'

import { IoChevronDown } from 'react-icons/io5'
import { filter, union } from 'lodash'
import { useParams } from 'wouter'

const EnterprisesFilters = ({
  enterpriseStatuses,
  filters,
  handleFilterChange,
  handleParamsChange,
}: any) => {
  const { project_id } = useParams<Record<string, string>>()
  const { countries, agencies } = useContext(ProjectsDataContext)

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

  const statusOptions = project_id
    ? filter(enterpriseStatuses, (status) => status.name !== 'Obsolete')
    : enterpriseStatuses

  return (
    <div className="flex h-full flex-wrap items-center gap-x-2 gap-y-2 border-0 border-solid">
      {project_id ? (
        <Field
          Input={{ placeholder: enterpriseFieldsMapping.agency }}
          options={getFilterOptions(filters, agencies, 'agency_id')}
          widget="autocomplete"
          onChange={(_: any, value: any) => {
            const agency = filters.agency_id || []
            const newValue = union(agency, value)

            handleFilterChange({ agency_id: newValue })
            handleParamsChange({
              agency_id: newValue.map((item: any) => item.id).join(','),
              offset: 0,
            })
          }}
          {...defaultProps}
        />
      ) : (
        <Field
          Input={{ placeholder: enterpriseFieldsMapping.country }}
          options={getFilterOptions(filters, countries, 'country_id')}
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
      )}
      <Field
        Input={{ placeholder: 'Status' }}
        options={getFilterOptions(filters, statusOptions, 'status')}
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
