import {
  displaySearchTerm,
  displaySelectedOption,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import {
  formatEntity,
  getAreFiltersApplied,
} from '@ors/components/manage/Blocks/ProjectsListing/utils'
import { PCRFiltersProps } from '../interfaces'
import { initialFilters } from '../constants'

import { Typography } from '@mui/material'
import { IoClose } from 'react-icons/io5'
import { map } from 'lodash'

const initialParams = {
  search: '',
  region_id: [],
  country_id: [],
  lead_agency_id: [],
  cooperating_agency_id: [],
  cluster_id: [],
  project_type_id: [],
  sector_id: [],
  subsector_id: [],
  category_id: [],
  submission_date: null,
}

const PCRFiltersSelectedOpts = ({
  form,
  filters,
  fieldToOptionsMapping,
  handleFilterChange,
  handleParamsChange,
}: PCRFiltersProps) => {
  const areFiltersApplied = getAreFiltersApplied(filters)

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
      entities: formatEntity(fieldToOptionsMapping.subsector),
      entityIdentifier: 'subsector_id',
    },
    {
      entities: formatEntity(fieldToOptionsMapping.category),
      entityIdentifier: 'category_id',
    },
  ]

  const displaySubmissionDate = !!filters.submission_date && (
    <Typography
      className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-2 py-1 text-lg font-normal text-black theme-dark:bg-gray-700/20"
      component="p"
      variant="h6"
    >
      {filters.submission_date.join('-')}
      <IoClose
        size={18}
        color="#666"
        className="cursor-pointer"
        onClick={() => {
          handleFilterChange({ submission_date: null })
          handleParamsChange({ submission_date: null, offset: 0 })
        }}
      />
    </Typography>
  )

  return (
    (areFiltersApplied || filters?.search || filters?.submission_date) && (
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
        {displaySubmissionDate}
        <Typography
          className="cursor-pointer content-center text-lg font-medium"
          color="secondary"
          component="span"
          onClick={() => {
            form.current.search.value = ''
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
