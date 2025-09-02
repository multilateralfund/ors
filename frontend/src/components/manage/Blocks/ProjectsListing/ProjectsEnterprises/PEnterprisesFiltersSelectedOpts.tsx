import { useContext } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import { displaySelectedOption } from '../HelperComponents'
import { formatEntity, getAreFiltersApplied } from '../utils'

import { Typography } from '@mui/material'
import { map } from 'lodash'

export const initialParams = {
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
  const { canViewProjects } = useContext(PermissionsContext)

  const areFiltersApplied = getAreFiltersApplied(filters)

  const filterSelectedOpts = [
    {
      entities: formatEntity(commonSlice.countries.data),
      entityIdentifier: 'country_id',
      hasPermissions: true,
    },
    {
      entities: formatEntity(enterpriseStatuses),
      entityIdentifier: 'status',
      hasPermissions: true,
    },
  ]

  return (
    (areFiltersApplied || filters?.search) && (
      <div className="mt-[6px] flex flex-wrap gap-2">
        {/* {canViewProjects &&
          displaySelectedOption(formatEntity(clusters), 'cluster_id')} */}
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
