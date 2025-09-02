import { useContext } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
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
  submission_status_id: [],
  status_id: [],
  search: '',
}

const ProjectsFiltersSelectedOpts = ({
  mode,
  commonSlice,
  projectSlice,
  meetings,
  form,
  initialFilters,
  filters,
  handleFilterChange,
  handleParamsChange,
}: any) => {
  const { canViewMetainfoProjects, canViewSectorsSubsectors } =
    useContext(PermissionsContext)
  const { clusters, project_types, sectors } = useContext(ProjectsDataContext)

  const { agencies, countries } = commonSlice
  const { submission_statuses, statuses } = projectSlice

  const areFiltersApplied = getAreFiltersApplied(filters)

  const filterSelectedOpts = [
    {
      entities: formatEntity(countries.data),
      entityIdentifier: 'country_id',
      hasPermissions: mode === 'listing',
    },
    {
      entities: formatEntity(agencies.data),
      entityIdentifier: 'agency_id',
      hasPermissions: true,
    },
    {
      entities: formatEntity(clusters),
      entityIdentifier: 'cluster_id',
      hasPermissions: canViewMetainfoProjects,
    },
    {
      entities: formatEntity(project_types),
      entityIdentifier: 'project_type_id',
      hasPermissions: canViewMetainfoProjects,
    },
    {
      entities: formatEntity(sectors),
      entityIdentifier: 'sector_id',
      hasPermissions: canViewSectorsSubsectors,
    },
    {
      entities: formatEntity(meetings, 'value'),
      entityIdentifier: 'meeting_id',
      hasPermissions: true,
      field: 'value',
    },
    {
      entities: formatEntity(submission_statuses.data),
      entityIdentifier: 'submission_status_id',
      hasPermissions: canViewMetainfoProjects,
    },
    {
      entities: formatEntity(statuses.data),
      entityIdentifier: 'status_id',
      hasPermissions: canViewMetainfoProjects,
    },
  ]

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
      <div className="mt-[6px] flex flex-wrap gap-2">
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

export default ProjectsFiltersSelectedOpts
