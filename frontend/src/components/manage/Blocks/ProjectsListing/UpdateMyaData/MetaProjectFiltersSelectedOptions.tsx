import { MetaProjectFiltersSelectedOptionsProps } from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/types.ts'
import {
  formatEntity,
  getAreFiltersApplied,
} from '@ors/components/manage/Blocks/ProjectsListing/utils.ts'
import { map } from 'lodash'
import { displaySelectedOption } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents.tsx'
import { Typography } from '@mui/material'
import {
  initialFilters,
  initialParams,
} from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/constants.ts'

export const MetaProjectFiltersSelectedOptions = (
  props: MetaProjectFiltersSelectedOptionsProps,
) => {
  const {
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

  return areFiltersApplied ? (
    <div className="mt-1.5 flex flex-wrap gap-2">
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
          handleParamsChange({ ...initialParams })
          handleFilterChange({ ...initialFilters })
        }}
      >
        Clear All
      </Typography>
    </div>
  ) : null
}
