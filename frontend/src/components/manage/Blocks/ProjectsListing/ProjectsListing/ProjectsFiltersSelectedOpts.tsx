import { useContext } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import { displaySelectedOption } from '../HelperComponents'
import { formatEntity, getAreFiltersApplied } from '../utils'

import { Typography } from '@mui/material'
import { IoClose } from 'react-icons/io5'
import { map } from 'lodash'

export const initialParams = {
  country_id: [],
  agency_id: [],
  cluster_id: [],
  project_type_id: [],
  sector_id: [],
  meeting_id: [],
  status_id: [],
  blanket_or_individual_consideration: [],
  search: '',
}

const ProjectsFiltersSelectedOpts = ({
  mode,
  filterOptions = {},
  form,
  initialFilters,
  filters,
  handleFilterChange,
  handleParamsChange,
}: any) => {
  const { canViewMetainfoProjects, canViewSectorsSubsectors } =
    useContext(PermissionsContext)

  const areFiltersApplied = getAreFiltersApplied(filters)

  const filterSelectedOpts = [
    {
      entities: formatEntity(filterOptions?.country),
      entityIdentifier: 'country_id',
      hasPermissions: mode === 'listing',
    },
    {
      entities: formatEntity(filterOptions?.agency),
      entityIdentifier: 'agency_id',
      hasPermissions: true,
    },
    {
      entities: formatEntity(filterOptions?.cluster),
      entityIdentifier: 'cluster_id',
      hasPermissions: canViewMetainfoProjects,
    },
    {
      entities: formatEntity(filterOptions?.project_type),
      entityIdentifier: 'project_type_id',
      hasPermissions: canViewMetainfoProjects,
    },
    {
      entities: formatEntity(filterOptions?.sector),
      entityIdentifier: 'sector_id',
      hasPermissions: canViewSectorsSubsectors,
    },
    {
      entities: formatEntity(filterOptions?.meeting, 'value'),
      entityIdentifier: 'meeting_id',
      hasPermissions: true,
      field: 'value',
    },
    {
      entities: formatEntity(filterOptions?.submission_status),
      entityIdentifier: 'submission_status_id',
      hasPermissions: canViewMetainfoProjects && mode === 'listing',
    },
    {
      entities: formatEntity(filterOptions?.status),
      entityIdentifier: 'status_id',
      hasPermissions: canViewMetainfoProjects,
    },
    {
      entities: formatEntity(
        filterOptions?.blanket_approval_individual_consideration,
      ),
      entityIdentifier: 'blanket_or_individual_consideration',
      hasPermissions: true,
    },
  ]

  const currentInitialParams =
    mode === 'listing'
      ? { ...initialParams, submission_status_id: [] }
      : initialParams

  const displaySearchTerm = () =>
    !!filters.search && (
      <Typography
        className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-2 py-1 text-lg font-normal text-black theme-dark:bg-gray-700/20"
        component="p"
        variant="h6"
      >
        {filters.search}
        <IoClose
          className="cursor-pointer"
          size={18}
          color="#666"
          onClick={() => {
            form.current.search.value = ''
            handleParamsChange({ offset: 0, search: '' })
            handleFilterChange({ search: '' })
          }}
        />
      </Typography>
    )

  return (
    (areFiltersApplied || filters?.search) && (
      <div className="mt-1.5 flex flex-wrap gap-2">
        {displaySearchTerm()}
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
              selectedOpt.field,
            ),
        )}

        <Typography
          className="cursor-pointer content-center text-lg font-medium"
          color="secondary"
          component="span"
          onClick={() => {
            form.current.search.value = ''
            handleParamsChange({ offset: 0, ...currentInitialParams })
            handleFilterChange({ ...initialFilters, ...currentInitialParams })
          }}
        >
          Clear All
        </Typography>
      </div>
    )
  )
}

export default ProjectsFiltersSelectedOpts
