import { displaySelectedOption } from '../../HelperComponents'
import { formatEntity, getAreFiltersApplied } from '../../utils'

import { Typography } from '@mui/material'
import { useParams } from 'wouter'
import { map } from 'lodash'

const EnterprisesFiltersSelectedOpts = ({
  commonSlice,
  enterpriseStatuses,
  initialFilters,
  filters,
  handleFilterChange,
  handleParamsChange,
}: any) => {
  const { project_id } = useParams<Record<string, string>>()
  const isEnterpriseView = !project_id

  const initialParams = {
    status: [],
    ...(isEnterpriseView && { country_id: [] }),
  }

  const filterSelectedOpts = [
    {
      entities: formatEntity(commonSlice.countries.data),
      entityIdentifier: 'country_id',
      isAvailable: isEnterpriseView,
    },
    {
      entities: formatEntity(enterpriseStatuses),
      entityIdentifier: 'status',
      isAvailable: true,
    },
  ]

  const areFiltersApplied = getAreFiltersApplied(filters)

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
