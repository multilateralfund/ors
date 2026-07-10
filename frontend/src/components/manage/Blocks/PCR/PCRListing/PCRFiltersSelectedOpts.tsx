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

import { Typography } from '@mui/material'
import { IoClose } from 'react-icons/io5'
import { map } from 'lodash'
import dayjs from 'dayjs'

const PCRFiltersSelectedOpts = ({
  form,
  filters,
  fieldToOptionsMapping,
  handleFilterChange,
  handleParamsChange,
}: PCRFiltersProps) => {
  const areFiltersApplied =
    getAreFiltersApplied(filters) ||
    filters?.search ||
    filters?.pcr_submission_date_after ||
    filters?.pcr_submission_date_before

  const filterSelectedOpts = [
    {
      entities: formatEntity(fieldToOptionsMapping.region),
      entityIdentifier: 'region_id',
    },
    {
      entities: formatEntity(fieldToOptionsMapping.country),
      entityIdentifier: 'country_id',
    },
    {
      entities: formatEntity(fieldToOptionsMapping.lead_agency),
      entityIdentifier: 'lead_agency_id',
    },
    {
      entities: formatEntity(fieldToOptionsMapping.cooperating_agency),
      entityIdentifier: 'cooperating_agency_id',
    },
    {
      entities: formatEntity(fieldToOptionsMapping.cluster),
      entityIdentifier: 'cluster_id',
    },
    {
      entities: formatEntity(fieldToOptionsMapping.project_type),
      entityIdentifier: 'project_type_id',
    },
    {
      entities: formatEntity(fieldToOptionsMapping.sector),
      entityIdentifier: 'sector_id',
    },
    {
      entities: formatEntity(fieldToOptionsMapping.subsectors),
      entityIdentifier: 'subsectors',
    },
    {
      entities: formatEntity(fieldToOptionsMapping.category),
      entityIdentifier: 'category',
    },
    {
      entities: formatEntity(fieldToOptionsMapping.status),
      entityIdentifier: 'status_id',
    },
    {
      entities: formatEntity(fieldToOptionsMapping.pcr_due),
      entityIdentifier: 'pcr_due',
      extraLabel: pcrFieldsMapping.pcr_due,
    },
    {
      entities: formatEntity(fieldToOptionsMapping.ad_hoc_pcr),
      entityIdentifier: 'ad_hoc_pcr',
      extraLabel: pcrFieldsMapping.ad_hoc_pcr,
    },
    {
      entities: formatEntity(fieldToOptionsMapping.pcr_submitted),
      entityIdentifier: 'pcr_submitted',
      extraLabel: pcrFieldsMapping.pcr_submitted,
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
        {map(filterSelectedOpts, (selectedOpt) =>
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
