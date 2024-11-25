import React from 'react'

import { Typography } from '@mui/material'
import { filter } from 'lodash'

import { multiYearFilterOptions } from '../constants'

import { IoClose } from 'react-icons/io5'

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
          className="inline-flex items-center gap-2 rounded bg-gray-200 px-4 font-normal theme-dark:bg-gray-700/20"
          component="p"
          variant="h6"
        >
          {entities?.get(entityId)?.name}
          <IoClose
            className="cursor-pointer"
            size={20}
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
          className="inline-flex items-center gap-2 rounded bg-gray-200 px-4 font-normal theme-dark:bg-gray-700/20"
          component="p"
          variant="h6"
        >
          {filters.search}
          <IoClose
            className="cursor-pointer"
            size={20}
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
    <div className="mt-[6px] flex flex-wrap gap-4">
      {displaySearchTerm()}
      {displaySelectedOption(formatEntity(countries.data), 'country_id')}
      {displaySelectedOption(formatEntity(agencies.data), 'agency_id')}
      {displaySelectedOption(formatEntity(clusters), 'project_cluster_id')}
      {displaySelectedOption(formatEntity(sectors.data), 'sector_id')}
      {displaySelectedOption(formatEntity(subsectors.data), 'subsector_id')}
      {displaySelectedOption(formatEntity(types.data), 'project_type_id')}
      {displaySelectedOption(
        formatEntity(multiYearFilterOptions),
        'is_multi_year',
      )}

      {(areFiltersApplied || filters?.search) && (
        <Typography
          className="cursor-pointer content-center"
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
      )}
    </div>
  )
}
