import { ViewSelectorValuesType } from '@ors/components/manage/Blocks/BusinessPlans/types'
import {
  displaySearchTerm,
  displaySelectedOption,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import {
  getAreFiltersApplied,
  formatEntity,
} from '@ors/components/manage/Blocks/ProjectsListing/utils'
import { initialFilters, initialParams, pcrFieldsMapping } from '../constants'
import { PCRFiltersProps } from '../interfaces'
import { getPcrHiddenFilters } from '../utils'

import { Typography } from '@mui/material'
import { IoClose } from 'react-icons/io5'
import { map, omit } from 'lodash'
import dayjs from 'dayjs'

const PCRFiltersSelectedOpts = ({
  form,
  filters,
  fieldToOptionsMapping,
  handleFilterChange,
  handleParamsChange,
  view,
}: PCRFiltersProps & {
  view: ViewSelectorValuesType | null
}) => {
  const hiddenFilters = getPcrHiddenFilters(view)
  const visibleFilters: Record<string, any> = omit(filters, hiddenFilters)
  const filtersToClear = omit(visibleFilters, 'pcr_submitted')

  const areFiltersApplied =
    getAreFiltersApplied(filtersToClear) ||
    visibleFilters?.search ||
    visibleFilters?.pcr_submission_date_after ||
    visibleFilters?.pcr_submission_date_before

  const getEntities = (field: string, entityIdentifier: string) =>
    formatEntity([
      ...(filters[entityIdentifier] ?? []),
      ...(fieldToOptionsMapping[field] ?? []),
    ])

  const filterSelectedOpts = [
    {
      entities: getEntities('status', 'status_id'),
      entityIdentifier: 'status_id',
    },
    {
      entities: getEntities('pcr_status', 'pcr_status'),
      entityIdentifier: 'pcr_status',
    },
    {
      entities: getEntities('country', 'country_id'),
      entityIdentifier: 'country_id',
    },
    {
      entities: getEntities('lead_agency', 'lead_agency_id'),
      entityIdentifier: 'lead_agency_id',
    },
    {
      entities: getEntities('cluster', 'cluster_id'),
      entityIdentifier: 'cluster_id',
    },
    {
      entities: getEntities('project_type', 'project_type_id'),
      entityIdentifier: 'project_type_id',
    },
    {
      entities: getEntities('sector', 'sector_id'),
      entityIdentifier: 'sector_id',
    },
    {
      entities: getEntities('category', 'category'),
      entityIdentifier: 'category',
    },
    {
      entities: getEntities('pcr_due', 'pcr_due'),
      entityIdentifier: 'pcr_due',
      extraLabel: pcrFieldsMapping.pcr_due,
    },
    {
      entities: getEntities('ad_hoc_pcr', 'ad_hoc_pcr'),
      entityIdentifier: 'ad_hoc_pcr',
      extraLabel: pcrFieldsMapping.ad_hoc_pcr,
    },
  ]

  const displayDateFilter = (label: string, filterKey: string) =>
    !!visibleFilters[filterKey] && (
      <Typography
        key={filterKey}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-2 py-1 text-lg font-normal text-black theme-dark:bg-gray-700/20"
        component="p"
        variant="h6"
      >
        {label}: {dayjs(filters[filterKey]).format('D MMM YYYY')}
        <IoClose
          className="cursor-pointer"
          color="#666"
          size={18}
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
        {map(
          filterSelectedOpts.filter(
            ({ entityIdentifier }) => !hiddenFilters.includes(entityIdentifier),
          ),
          (selectedOpt) =>
            displaySelectedOption(
              filters,
              selectedOpt.entities,
              selectedOpt.entityIdentifier,
              handleFilterChange,
              handleParamsChange,
              'id',
              selectedOpt.extraLabel,
            ),
        )}
        {displayDateFilter('PCR submission from', 'pcr_submission_date_after')}
        {displayDateFilter('PCR submission to', 'pcr_submission_date_before')}
        <Typography
          className="cursor-pointer content-center text-lg font-medium"
          color="secondary"
          component="span"
          onClick={() => {
            const inputSearch = form.current?.search
            if (inputSearch) {
              inputSearch.value = ''
            }
            handleFilterChange({ ...initialFilters, ...initialParams })
            handleParamsChange({ offset: 0, ...initialParams })
          }}
        >
          Clear All
        </Typography>
      </div>
    )
  )
}

export default PCRFiltersSelectedOpts
