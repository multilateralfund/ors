import { MetaProjectFiltersSelectedOptionsProps } from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/types.ts'
import {
  formatEntity,
  getAreFiltersApplied,
} from '@ors/components/manage/Blocks/ProjectsListing/utils.ts'
import {
  displaySearchTerm,
  displaySelectedOption,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents.tsx'
import { initialFilters } from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/constants.ts'

import { Typography } from '@mui/material'
import { map } from 'lodash'

export const MetaProjectFiltersSelectedOptions = (
  props: MetaProjectFiltersSelectedOptionsProps,
) => {
  const {
    form,
    params,
    countries,
    agencies,
    clusters,
    filters,
    handleFilterChange,
    handleParamsChange,
  } = props

  const areFiltersApplied = getAreFiltersApplied(filters)

  const filterSelectedOpts = [
    {
      entities: formatEntity(countries),
      entityIdentifier: 'country_id',
      hasPermissions: true,
    },
    {
      entities: formatEntity(agencies),
      entityIdentifier: 'lead_agency_id',
      hasPermissions: true,
    },
    {
      entities: formatEntity(clusters),
      entityIdentifier: 'cluster_id',
      hasPermissions: true,
    },
  ]

  return areFiltersApplied || filters?.search ? (
    <div className="mt-1.5 flex flex-wrap gap-2">
      {displaySearchTerm(form, filters, handleFilterChange, handleParamsChange)}
      {map(
        filterSelectedOpts,
        (selectedOpt) =>
          selectedOpt.hasPermissions &&
          displaySelectedOption(
            filters,
            selectedOpt.entities,
            selectedOpt.entityIdentifier,
            handleFilterChange,
            handleParamsChange,
          ),
      )}

      <Typography
        className="cursor-pointer content-center text-lg font-medium"
        color="secondary"
        component="span"
        onClick={() => {
          const inputSearch = form.current?.search
          if (inputSearch) {
            inputSearch.value = ''
          }
          handleParamsChange({ ...params })
          handleFilterChange({ ...initialFilters })
        }}
      >
        Clear All
      </Typography>
    </div>
  ) : null
}
