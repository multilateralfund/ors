import { MetaProjectFiltersProps } from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/types.ts'
import { IoChevronDown } from 'react-icons/io5'
import Field from '@ors/components/manage/Form/Field.tsx'
import { getFilterOptions } from '@ors/components/manage/Utils/utilFunctions.ts'
import { union } from 'lodash'

export const MetaProjectFilters = (props: MetaProjectFiltersProps) => {
  const {
    filters,
    countries,
    agencies,
    clusters,
    handleFilterChange,
    handleParamsChange,
  } = props

  const defaultProps = {
    multiple: true,
    value: [],
    getOptionLabel: (option: any) => option?.name,
    FieldProps: { className: 'mb-0 w-full md:w-[7.76rem] BPList' },
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
      <Field
        Input={{ placeholder: 'Country' }}
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
      <Field
        Input={{ placeholder: 'Lead agency' }}
        options={getFilterOptions(filters, agencies, 'lead_agency_id')}
        widget="autocomplete"
        onChange={(_: any, value: any) => {
          const agency = filters.lead_agency_id || []
          const newValue = union(agency, value)

          handleFilterChange({ lead_agency_id: newValue })
          handleParamsChange({
            lead_agency_id: newValue.map((item: any) => item.id).join(','),
            offset: 0,
          })
        }}
        {...defaultProps}
      />
      <Field
        Input={{ placeholder: 'Cluster' }}
        options={getFilterOptions(filters, clusters, 'cluster_id')}
        widget="autocomplete"
        onChange={(_: any, value: any) => {
          const cluster = filters.cluster_id || []
          const newValue = union(cluster, value)

          handleFilterChange({ cluster_id: newValue })
          handleParamsChange({
            cluster_id: newValue.map((item: any) => item.id).join(','),
            offset: 0,
          })
        }}
        {...defaultProps}
      />
    </div>
  )
}
