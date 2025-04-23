import { Typography } from '@mui/material'
import { filter } from 'lodash'

import { IoClose } from 'react-icons/io5'

const ProjectsFiltersSelectedOpts = ({
  commonSlice,
  projectSlice,
  clusters,
  meetings,
  form,
  initialFilters,
  filters,
  handleFilterChange,
  handleParamsChange,
}: any) => {
  const { agencies, countries } = commonSlice
  const { types } = projectSlice

  const initialParams = {
    country_id: [],
    agency_id: [],
    cluster_id: [],
    project_type_id: [],
    meeting_id: [],
    search: '',
  }

  const formatEntity = (currentEntity: any = [], field: string = 'id') => {
    return new Map<number, any>(
      currentEntity.map((entity: any) => [entity[field], entity]),
    )
  }

  const areFiltersApplied = Object.values(filters).find(
    (filter) => Array.isArray(filter) && filter.length > 0,
  )

  const displaySelectedOption = (
    entities: any,
    entityIdentifier: string,
    field: string = 'id',
  ) => {
    return filters?.[entityIdentifier]?.map((entity: any) => {
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
  }

  const displaySearchTerm = () => {
    return (
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
    )
  }

  return (
    (areFiltersApplied || filters?.search) && (
      <div className="mt-[6px] flex flex-wrap gap-2">
        {displaySearchTerm()}
        {displaySelectedOption(formatEntity(countries.data), 'country_id')}
        {displaySelectedOption(formatEntity(agencies.data), 'agency_id')}
        {displaySelectedOption(formatEntity(clusters), 'cluster_id')}
        {displaySelectedOption(formatEntity(types.data), 'project_type_id')}
        {displaySelectedOption(
          formatEntity(meetings, 'value'),
          'meeting_id',
          'value',
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
