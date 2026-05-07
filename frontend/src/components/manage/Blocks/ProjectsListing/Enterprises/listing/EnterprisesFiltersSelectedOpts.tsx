import { useContext } from 'react'

import EnterprisesDataContext from '@ors/contexts/Enterprises/EnterprisesDataContext'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import {
  displaySearchTerm,
  displaySelectedOption,
} from '../../HelperComponents'
import { formatEntity, getAreFiltersApplied } from '../../utils'

import { Typography } from '@mui/material'
import { map } from 'lodash'

const EnterprisesFiltersSelectedOpts = ({
  form,
  meetings,
  initialFilters,
  filters,
  handleFilterChange,
  handleParamsChange,
}: any) => {
  const { countries, agencies, project_types, sectors, subsectors } =
    useContext(ProjectsDataContext)
  const { statuses } = useContext(EnterprisesDataContext)

  const initialParams = {
    search: '',
    country_id: [],
    agency_id: [],
    meeting_id: [],
    project_type_id: [],
    sector_id: [],
    subsector_id: [],
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
      entities: formatEntity(meetings, 'value'),
      entityIdentifier: 'meeting_id',
      field: 'value',
    },
    {
      entities: formatEntity(project_types),
      entityIdentifier: 'project_type_id',
    },
    {
      entities: formatEntity(sectors),
      entityIdentifier: 'sector_id',
    },
    {
      entities: formatEntity(subsectors),
      entityIdentifier: 'subsector_id',
    },
    {
      entities: formatEntity(statuses),
      entityIdentifier: 'status_id',
    },
  ]

  const areFiltersApplied = getAreFiltersApplied(filters)

  return (
    (areFiltersApplied || filters?.search) && (
      <div className="mt-1.5 flex flex-wrap gap-2">
        {displaySearchTerm(
          form,
          filters,
          handleFilterChange,
          handleParamsChange,
        )}
        {map(filterSelectedOpts, (selectedOpt) =>
          displaySelectedOption(
            filters,
            selectedOpt.entities,
            selectedOpt.entityIdentifier,
            handleFilterChange,
            handleParamsChange,
            selectedOpt.field,
          ),
        )}
        <Typography
          className="cursor-pointer content-center text-lg font-medium"
          color="secondary"
          component="span"
          onClick={() => {
            form.current.search.value = ''
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
