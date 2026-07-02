import { useMemo, useRef, useState, useContext } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { RedirectBackButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRFiltersSelectedOpts from './PCRFiltersSelectedOpts'
import PCRFilters from './PCRFilters'
import PCRTable from './PCRTable'
import { categoryOpts, initialFilters } from '../constants'
import { useGetPCRProjects } from '../hooks/useGetPCRProjects'

const PCRListingWrapper = () => {
  const form = useRef<any>()

  const { countries, agencies, project_types, clusters, sectors, subsectors } =
    useContext(ProjectsDataContext)

  const [filters, setFilters] = useState(initialFilters)
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const pcrProjects = useGetPCRProjects(initialFilters)
  const { loading, setParams } = pcrProjects

  const fieldToOptionsMapping: Record<string, any[]> = {
    region: countries,
    country: countries,
    lead_agency: agencies,
    cooperating_agency: agencies,
    cluster: clusters,
    project_type: project_types,
    sector: sectors,
    subsector: subsectors,
    category: categoryOpts,
  }

  const handleFilterChange = (newFilters: { [key: string]: any }) => {
    setFilters((filters: any) => ({ ...filters, ...newFilters }))
  }

  const handleParamsChange = (params: { [key: string]: any }) => {
    setParams(params)
  }

  const filtersProps = {
    form,
    filters,
    fieldToOptionsMapping,
    handleFilterChange,
    handleParamsChange,
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <HeaderTitle>
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <RedirectBackButton />
            <PageHeading>Project Completion Reports</PageHeading>
          </div>
        </div>
      </HeaderTitle>
      <div className="flex flex-col gap-6" key={key}>
        <div className="flex flex-col gap-2.5">
          <PCRFilters {...filtersProps} />
          <PCRFiltersSelectedOpts {...filtersProps} />
        </div>
        <PCRTable {...{ pcrProjects, filters }} />
      </div>
    </>
  )
}

export default PCRListingWrapper
