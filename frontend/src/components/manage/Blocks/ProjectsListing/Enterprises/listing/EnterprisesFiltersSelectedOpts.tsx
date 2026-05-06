import { useContext } from 'react'

import EnterprisesDataContext from '@ors/contexts/Enterprises/EnterprisesDataContext'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import { displaySelectedOption } from '../../HelperComponents'
import { formatEntity, getAreFiltersApplied } from '../../utils'

import { Typography } from '@mui/material'
import { map } from 'lodash'

const EnterprisesFiltersSelectedOpts = ({
  initialFilters,
  filters,
  handleFilterChange,
  handleParamsChange,
}: any) => {
  const { countries, agencies } = useContext(ProjectsDataContext)
  const { statuses } = useContext(EnterprisesDataContext)

  const initialParams = {
    country_id: [],
    agency_id: [],
    status_id: [],
  }

  const filterSelectedOpts = [
    {
      entities: formatEntity(countries),
      entityIdentifier: 'country_id',
    },
    {
      entities: formatEntity(agencies),
      entityIdentifier: 'agency_id',
    },
    {
      entities: formatEntity(statuses),
      entityIdentifier: 'status_id',
    },
  ]

  const areFiltersApplied = getAreFiltersApplied(filters)

  return (
    areFiltersApplied && (
      <div className="mt-1.5 flex flex-wrap gap-2">
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

export default EnterprisesFiltersSelectedOpts
