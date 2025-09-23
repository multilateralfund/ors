import { displaySelectedOption } from '../../HelperComponents'
import { formatEntity, getAreFiltersApplied } from '../../utils'

import { Typography } from '@mui/material'
import { map } from 'lodash'

const EnterprisesFiltersSelectedOpts = ({
  enterpriseStatuses,
  commonSlice,
  initialFilters,
  filters,
  handleFilterChange,
  handleParamsChange,
}: any) => {
  const initialParams = {
    country_id: [],
    status: [],
  }

  const areFiltersApplied = getAreFiltersApplied(filters)

  const filterSelectedOpts = [
    {
      entities: formatEntity(commonSlice.countries.data),
      entityIdentifier: 'country_id',
      isAvailable: true,
    },
    {
      entities: formatEntity(enterpriseStatuses),
      entityIdentifier: 'status',
      isAvailable: true,
    },
  ]

  return (
    areFiltersApplied && (
      <div className="mt-1.5 flex flex-wrap gap-2">
        {map(
          filterSelectedOpts,
          (selectedOpt) =>
            selectedOpt.isAvailable &&
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

export default EnterprisesFiltersSelectedOpts
