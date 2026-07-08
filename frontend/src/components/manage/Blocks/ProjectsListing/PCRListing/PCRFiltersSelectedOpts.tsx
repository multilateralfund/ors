import { RefObject } from 'react'

import { displaySearchTerm, displaySelectedOption } from '../HelperComponents'
import { formatEntity, getAreFiltersApplied } from '../utils'
import { pcrInitialFilters } from './constants'
import { PCRFilterOptions } from './types'

import { Typography } from '@mui/material'
import { IoClose } from 'react-icons/io5'
import { map } from 'lodash'

type PCRFiltersSelectedOptsProps = {
  filterOptions?: PCRFilterOptions
  form: RefObject<HTMLFormElement>
  filters: Record<string, any>
  handleFilterChange: (params: Record<string, any>) => void
  handleParamsChange: (params: Record<string, any>) => void
}

const PCRFiltersSelectedOpts = ({
  filterOptions = {},
  form,
  filters,
  handleFilterChange,
  handleParamsChange,
}: PCRFiltersSelectedOptsProps) => {
  const areFiltersApplied =
    getAreFiltersApplied(filters) ||
    filters?.search ||
    filters?.submission_date_after ||
    filters?.submission_date_before

  const filterSelectedOpts = [
    {
      entities: formatEntity(filterOptions?.region),
      entityIdentifier: 'region_id',
    },
    {
      entities: formatEntity(filterOptions?.country),
      entityIdentifier: 'country_id',
    },
    {
      entities: formatEntity(filterOptions?.lead_agency),
      entityIdentifier: 'lead_agency_id',
    },
    {
      entities: formatEntity(filterOptions?.cooperating_agency),
      entityIdentifier: 'cooperating_agency_id',
    },
    {
      entities: formatEntity(filterOptions?.cluster),
      entityIdentifier: 'cluster_id',
    },
    {
      entities: formatEntity(filterOptions?.project_type),
      entityIdentifier: 'project_type_id',
    },
    {
      entities: formatEntity(filterOptions?.sector),
      entityIdentifier: 'sector_id',
    },
    {
      entities: formatEntity(filterOptions?.subsector),
      entityIdentifier: 'subsector_id',
    },
    {
      entities: formatEntity(filterOptions?.category),
      entityIdentifier: 'category',
    },
    {
      entities: formatEntity(filterOptions?.pcr_due),
      entityIdentifier: 'pcr_due',
    },
  ]

  const displayDateFilter = (label: string, filterKey: string) =>
    !!filters[filterKey] && (
      <Typography
        key={filterKey}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-2 py-1 text-lg font-normal text-black theme-dark:bg-gray-700/20"
        component="p"
        variant="h6"
      >
        {label}: {filters[filterKey]}
        <IoClose
          className="cursor-pointer"
          size={18}
          color="#666"
          onClick={() => {
            handleFilterChange({ [filterKey]: '' })
            handleParamsChange({ [filterKey]: '', offset: 0 })
          }}
        />
      </Typography>
    )

  return (
    areFiltersApplied && (
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
          ),
        )}
        {displayDateFilter('Submission from', 'submission_date_after')}
        {displayDateFilter('Submission to', 'submission_date_before')}

        <Typography
          className="cursor-pointer content-center text-lg font-medium"
          color="secondary"
          component="span"
          onClick={() => {
            const inputSearch = form.current?.search
            if (inputSearch) {
              inputSearch.value = ''
            }
            handleParamsChange({ ...pcrInitialFilters })
            handleFilterChange({ ...pcrInitialFilters })
          }}
        >
          Clear All
        </Typography>
      </div>
    )
  )
}

export default PCRFiltersSelectedOpts
