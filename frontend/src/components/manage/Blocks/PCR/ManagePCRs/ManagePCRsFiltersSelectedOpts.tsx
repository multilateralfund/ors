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
import { map, omit } from 'lodash'

const ManagePCRsFiltersSelectedOpts = ({
  form,
  filters,
  fieldToOptionsMapping,
  handleFilterChange,
  handleParamsChange,
}: PCRFiltersProps) => {
  const filtersToClear = omit(filters, 'pcr_submitted', 'pcr_due')

  const areFiltersApplied =
    getAreFiltersApplied(filtersToClear) || filters?.search

  const filterSelectedOpts = [
    {
      entities: formatEntity(fieldToOptionsMapping.country),
      entityIdentifier: 'country_id',
    },
    {
      entities: formatEntity(fieldToOptionsMapping.lead_agency),
      entityIdentifier: 'lead_agency_id',
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
      entities: formatEntity(fieldToOptionsMapping.category),
      entityIdentifier: 'category',
    },
    {
      entities: formatEntity(fieldToOptionsMapping.status),
      entityIdentifier: 'status_id',
    },
    {
      entities: formatEntity(fieldToOptionsMapping.ad_hoc_pcr),
      entityIdentifier: 'ad_hoc_pcr',
      extraLabel: pcrFieldsMapping.ad_hoc_pcr,
    },
  ]

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
        <Typography
          className="cursor-pointer content-center text-lg font-medium"
          color="secondary"
          component="span"
          onClick={() => {
            const inputSearch = form.current?.search
            if (inputSearch) {
              inputSearch.value = ''
            }
            const params = omit(initialParams, 'pcr_due')

            handleFilterChange({ ...initialFilters, ...params })
            handleParamsChange({ offset: 0, ...params })
          }}
        >
          Clear All
        </Typography>
      </div>
    )
  )
}

export default ManagePCRsFiltersSelectedOpts
