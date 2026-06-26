import {
  displaySearchTerm,
  displaySelectedOption,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import {
  formatEntity,
  getAreFiltersApplied,
} from '@ors/components/manage/Blocks/ProjectsListing/utils'

import { Typography } from '@mui/material'
import { map } from 'lodash'
import { IoClose } from 'react-icons/io5'

const PCRFiltersSelectedOpts = ({
  form,
  filterOptions = {},
  initialFilters,
  filters,
  handleFilterChange,
  handleParamsChange,
}: any) => {
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
      entityIdentifier: 'category_id',
    },
  ]

  const areFiltersApplied = getAreFiltersApplied(filters)

  const displaySubmissionDate = !!filters.submission_date && (
    <Typography
      className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-2 py-1 text-lg font-normal text-black theme-dark:bg-gray-700/20"
      component="p"
      variant="h6"
    >
      {filters.submission_date.join('-')}
      <IoClose
        className="cursor-pointer"
        size={18}
        color="#666"
        onClick={() => {
          handleFilterChange({
            submission_date: null,
          })
          handleParamsChange({
            submission_date: null,
            offset: 0,
          })
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

export default PCRFiltersSelectedOpts
