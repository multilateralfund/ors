import { displaySelectedOption } from '../../HelperComponents'
import { formatEntity, getAreFiltersApplied } from '../../utils'

import { Typography } from '@mui/material'
import { useParams } from 'wouter'
import { map } from 'lodash'

const PEnterprisesFiltersSelectedOpts = ({
  type,
  enterpriseStatuses,
  commonSlice,
  initialFilters,
  filters,
  handleFilterChange,
  handleParamsChange,
}: any) => {
  const { project_id } = useParams<Record<string, string>>()

  const areFiltersApplied = getAreFiltersApplied(filters)
  const hasProjectsFilter = !project_id && type === 'project-enterprises'

  const initialParams = hasProjectsFilter
    ? {
        project_id: [],
        country_id: [],
        status: [],
      }
    : {
        country_id: [],
        status: [],
      }

  const filterSelectedOpts = [
    {
      entities: hasProjectsFilter
        ? formatEntity(filters?.['project_id'] ?? [])
        : [],
      entityIdentifier: 'project_id',
      isAvailable: hasProjectsFilter,
    },
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
      <div className="mt-[6px] flex flex-wrap gap-2">
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

export default PEnterprisesFiltersSelectedOpts
