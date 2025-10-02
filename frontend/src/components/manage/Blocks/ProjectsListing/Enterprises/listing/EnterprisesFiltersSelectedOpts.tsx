import { displaySelectedOption } from '../../HelperComponents'
import { formatEntity, getAreFiltersApplied } from '../../utils'

import { Typography } from '@mui/material'
import { useParams } from 'wouter'
import { map } from 'lodash'

const EnterprisesFiltersSelectedOpts = ({
  enterpriseStatuses,
  commonSlice,
  initialFilters,
  filters,
  handleFilterChange,
  handleParamsChange,
}: any) => {
  const { project_id } = useParams<Record<string, string>>()

  const areFiltersApplied = getAreFiltersApplied(filters)
  const isEnterpriseView = !project_id

  const initialParams = isEnterpriseView
    ? {
        country_id: [],
        status: [],
      }
    : {
        status: [],
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
