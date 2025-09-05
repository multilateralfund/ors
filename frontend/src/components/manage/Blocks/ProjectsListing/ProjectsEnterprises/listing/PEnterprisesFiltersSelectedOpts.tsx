import { displaySelectedOption } from '../../HelperComponents'
import { formatEntity, getAreFiltersApplied } from '../../utils'

import { Typography } from '@mui/material'
import { map } from 'lodash'

export const initialParams = {
  project_id: [],
  country_id: [],
  status: [],
}

const PEnterprisesFiltersSelectedOpts = ({
  enterpriseStatuses,
  commonSlice,
  initialFilters,
  filters,
  handleFilterChange,
  handleParamsChange,
}: any) => {
  const areFiltersApplied = getAreFiltersApplied(filters)

  const filterSelectedOpts = [
    {
      entities: formatEntity(filters?.['project_id'] ?? []),
      entityIdentifier: 'project_id',
    },
    {
      entities: formatEntity(commonSlice.countries.data),
      entityIdentifier: 'country_id',
    },
    {
      entities: formatEntity(enterpriseStatuses),
      entityIdentifier: 'status',
    },
  ]

  return (
    areFiltersApplied && (
      <div className="mt-[6px] flex flex-wrap gap-2">
        {map(filterSelectedOpts, (selectedOpt) =>
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
            handleParamsChange({ offset: 0, ...initialParams })
            handleFilterChange({ ...initialFilters, ...initialParams })
          }}
        >
          Clear All
        </Typography>
      </div>
    )
  )
}

export default PEnterprisesFiltersSelectedOpts
