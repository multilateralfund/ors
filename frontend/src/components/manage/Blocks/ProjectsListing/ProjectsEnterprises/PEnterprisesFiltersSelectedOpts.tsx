import { useContext } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'

import { Typography } from '@mui/material'
import { IoClose } from 'react-icons/io5'
import { filter } from 'lodash'

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

const PEnterprisesFiltersSelectedOpts = ({
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

  const areFiltersApplied = Object.values(filters).find(
    (filter) => Array.isArray(filter) && filter.length > 0,
  )

  const formatEntity = (currentEntity: any = [], field: string = 'id') =>
    new Map<number, any>(
      currentEntity.map((entity: any) => [entity[field], entity]),
    )

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

  const displaySelectedOption = (
    entities: any,
    entityIdentifier: string,
    field: string = 'id',
  ) =>
    filters?.[entityIdentifier]?.map((entity: any) => {
      const entityId = entity[field]

      return (
        <Typography
          key={entityId}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-2 py-1 text-lg font-normal text-black theme-dark:bg-gray-700/20"
          component="p"
          variant="h6"
        >
          {entities?.get(entityId)?.name || entities?.get(entityId)?.label}
          <IoClose
            className="cursor-pointer"
            size={18}
            color="#666"
            onClick={() => {
              const values = filters[entityIdentifier] || []
              const newValue = filter(
                values,
                (value) => value[field] !== entityId,
              )

              handleFilterChange({
                [entityIdentifier]: newValue,
              })
              handleParamsChange({
                [entityIdentifier]: newValue
                  .map((item: any) => item[field])
                  .join(','),
                offset: 0,
              })
            }}
          />
        </Typography>
      )
    })

  return (
    (areFiltersApplied || filters?.search) && (
      <div className="mt-[6px] flex flex-wrap gap-2">
        {displaySearchTerm()}
        {mode === 'listing' &&
          displaySelectedOption(formatEntity(countries.data), 'country_id')}
        {displaySelectedOption(formatEntity(agencies.data), 'agency_id')}
        {canViewMetainfoProjects &&
          displaySelectedOption(formatEntity(clusters), 'cluster_id')}
        {canViewMetainfoProjects &&
          displaySelectedOption(formatEntity(project_types), 'project_type_id')}
        {canViewSectorsSubsectors &&
          displaySelectedOption(formatEntity(sectors), 'sector_id')}
        {displaySelectedOption(
          formatEntity(meetings, 'value'),
          'meeting_id',
          'value',
        )}
        {canViewMetainfoProjects &&
          displaySelectedOption(
            formatEntity(submission_statuses.data),
            'submission_status_id',
          )}
        {canViewMetainfoProjects &&
          displaySelectedOption(formatEntity(statuses.data), 'status_id')}

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

export default PEnterprisesFiltersSelectedOpts
