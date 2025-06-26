import { useContext } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import { multiYearFilterOptions } from '../constants'

import { Typography } from '@mui/material'
import { IoClose } from 'react-icons/io5'
import { filter } from 'lodash'

export default function ActivitiesFiltersSelectedOpts(props: any) {
  const {
    bpSlice,
    clusters,
    commonSlice,
    filters,
    form,
    handleFilterChange,
    handleParamsChange,
    initialFilters,
    withAgency,
  } = props
  const { canViewMetainfoProjects } = useContext(PermissionsContext)

  const { agencies, countries } = commonSlice
  const { sectors, subsectors, types } = bpSlice

  const initialParams = {
    country_id: [],
    is_multi_year: [],
    project_cluster_id: [],
    project_type_id: [],
    search: '',
    sector_id: [],
    subsector_id: [],
    ...(withAgency && { agency_id: [] }),
  }

  const formatEntity = (currentEntity: any = []) => {
    return new Map<number, any>(
      currentEntity.map((entity: any) => [entity.id, entity]),
    )
  }

  const areFiltersApplied = Object.values(filters).find(
    (filter) => Array.isArray(filter) && filter.length > 0,
  )

  const displaySelectedOption = (entities: any, entityIdentifier: string) => {
    return filters?.[entityIdentifier]?.map((entity: any) => {
      const entityId = entity.id

      return (
        <Typography
          key={entityId}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-2 py-1 text-lg font-normal text-black theme-dark:bg-gray-700/20"
          component="p"
          variant="h6"
        >
          {entities?.get(entityId)?.name}
          <IoClose
            className="cursor-pointer"
            size={18}
            color="#666"
            onClick={() => {
              const values = filters[entityIdentifier] || []
              const newValue = filter(values, (value) => value.id !== entityId)

              handleFilterChange({
                [entityIdentifier]: newValue,
              })
              handleParamsChange({
                [entityIdentifier]: newValue
                  .map((item: any) => item.id)
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
        {canViewMetainfoProjects &&
          displaySelectedOption(formatEntity(clusters), 'project_cluster_id')}
        {canViewMetainfoProjects &&
          displaySelectedOption(formatEntity(types.data), 'project_type_id')}
        {displaySelectedOption(formatEntity(sectors.data), 'sector_id')}
        {displaySelectedOption(formatEntity(subsectors.data), 'subsector_id')}
        {displaySelectedOption(
          formatEntity(multiYearFilterOptions),
          'is_multi_year',
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
