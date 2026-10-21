import {
  displaySearchTerm,
  displaySelectedOption,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import {
  getAreFiltersApplied,
  formatEntity,
} from '@ors/components/manage/Blocks/ProjectsListing/utils'
import { initialFilters, initialParams } from '../constants'
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
  const filtersToClear = omit(filters, 'pcr_submitted', 'pcr_due', 'ad_hoc_pcr')

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
      entities: formatEntity(fieldToOptionsMapping.category),
      entityIdentifier: 'category',
    },
    {
      entities: formatEntity(fieldToOptionsMapping.completed_only),
      entityIdentifier: 'completed_only',
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
            const params = {
              ...omit(
                { ...initialParams, completed_only: [] },
                'pcr_due',
                'ad_hoc_pcr',
              ),
            }

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
